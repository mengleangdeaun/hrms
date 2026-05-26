<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CRM\Contact;
use App\Models\CRM\ContactAttachment;
use App\Models\CRM\Customer;
use App\Models\CRM\CustomerType;
use App\Services\DocumentNumberService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Services\ImageService;
use App\Http\Resources\CRM\ContactResource;

use App\Http\Resources\CRM\ContactListResource;

class ContactController extends Controller
{
    protected $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    public function index(Request $request)
    {
        if ($request->paginate === 'false') {
            return ContactListResource::collection(
                Contact::select(['id', 'ulid', 'name', 'phone', 'email', 'type', 'company_name'])
                         ->latest()
                         ->get()
            );
        }

        $query = Contact::select([
            'id', 'ulid', 'category_id', 'type', 'name', 'company_name', 
            'parent_id', 'position', 'email', 'phone', 'image', 'source', 'created_at'
        ])->with(['category:id,name', 'parent:id,ulid,name']);

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('parent_id')) {
            $query->where('parent_id', $request->parent_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return ContactListResource::collection($query->latest()->paginate($request->per_page ?? 15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:crm_contact_categories,id',
            'type' => 'required|string|in:' . implode(',', Contact::getTypes()),
            'name' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'parent_id' => 'nullable|string|exists:crm_contacts,ulid',
            'position' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'google_map_link' => 'nullable|string|url',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'image' => 'nullable',
            'source' => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            if ($request->hasFile('image')) {
                $path = $this->imageService->compressToWebp($request->file('image'), 'crm/contacts');
                $validated['image'] = $path;
            }

            $contact = Contact::create($validated);

            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('crm/contacts/' . $contact->ulid, 'public');
                    $contact->attachments()->create([
                        'file_path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                    ]);
                }
            }

            return new ContactResource($contact->load(['category', 'attachments', 'parent', 'children']));
        });
    }

    public function show(Contact $contact)
    {
        return new ContactResource($contact->load(['category', 'attachments', 'leads.stage', 'parent', 'children']));
    }

    public function update(Request $request, Contact $contact)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:crm_contact_categories,id',
            'type' => 'required|string|in:' . implode(',', Contact::getTypes()),
            'name' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'parent_id' => 'nullable|string|exists:crm_contacts,ulid',
            'position' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'google_map_link' => 'nullable|string|url',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'image' => 'nullable',
            'source' => 'nullable|string|max:255',
        ]);

        if ($request->hasFile('image')) {
            $path = $this->imageService->compressToWebp($request->file('image'), 'crm/contacts');
            $validated['image'] = $path;
        }

        $contact->update($validated);

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('crm/contacts/' . $contact->ulid, 'public');
                $contact->attachments()->create([
                    'file_path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                ]);
            }
        }

        return new ContactResource($contact->load(['category', 'attachments', 'parent', 'children']));
    }

    public function destroy(Contact $contact)
    {
        $contact->delete();
        return response()->json(null, 204);
    }

    /**
     * Promote a Contact to a Customer.
     */
    public function promote(Contact $contact)
    {
        if (!$contact->phone) {
            return response()->json(['message' => 'Contact must have a phone number to be promoted.'], 422);
        }

        // 1. Duplicate Check
        if (Customer::where('phone', $contact->phone)->exists()) {
            return response()->json([
                'message' => 'This contact is already a customer (phone number already exists).',
                'is_duplicate' => true
            ], 400);
        }

        return DB::transaction(function () use ($contact) {
            $defaultType = CustomerType::where('is_default', true)->first() ?? CustomerType::first();

            // Handle hierarchical relationship mapping (ULID to BigInt ID)
            $parentCustomerId = null;
            if ($contact->parent_id) {
                $parentContact = Contact::where('ulid', $contact->parent_id)->first();
                if ($parentContact && $parentContact->is_converted) {
                    $parentCustomerId = $parentContact->promoted_customer_id;
                }
            }

            $customerData = [
                'type' => $contact->type,
                'name' => $contact->name,
                'company_name' => $contact->company_name,
                'parent_id' => $parentCustomerId,
                'phone' => $contact->phone,
                'email' => $contact->email,
                'address' => $contact->address,
                'joined_at' => now(),
                'customer_type_id' => $defaultType ? $defaultType->id : 1,
                'status' => 'ACTIVE',
                'notes' => 'Promoted from CRM Contact. ' . $contact->notes,
                'image' => $contact->image,
                'source' => $contact->source,
            ];

            $customer = Customer::create($customerData);

            $contact->update([
                'is_converted' => true,
                'promoted_customer_id' => $customer->id
            ]);

            return response()->json([
                'message' => 'Successfully promoted to customer!',
                'customer' => $customer->load(['customer_type', 'parent'])
            ]);
        });
    }

    /**
     * Sync the hierarchical relationships (children) of a Contact.
     */
    public function syncHierarchy(Request $request, Contact $contact)
    {
        $request->validate([
            'child_ulids' => 'array',
            'child_ulids.*' => 'string|exists:crm_contacts,ulid',
        ]);

        return DB::transaction(function () use ($request, $contact) {
            $childUlids = $request->input('child_ulids', []);

            // 1. Remove parent_id from current children that are no longer in the list
            Contact::where('parent_id', $contact->ulid)
                ->whereNotIn('ulid', $childUlids)
                ->update(['parent_id' => null]);

            // 2. Add parent_id to the new list of children
            if (!empty($childUlids)) {
                Contact::whereIn('ulid', $childUlids)
                    ->update(['parent_id' => $contact->ulid]);
            }

            return response()->json([
                'message' => 'Hierarchy updated successfully.',
            ]);
        });
    }
    
    /**
     * Delete an attachment.
     */
    public function deleteAttachment(Contact $contact, ContactAttachment $attachment)
    {
        // Verify the attachment belongs to the contact
        if ($attachment->contact_id !== $contact->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Delete from storage
        if (Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        // Delete from DB
        $attachment->delete();

        return response()->json(['message' => 'Attachment deleted successfully']);
    }
}
