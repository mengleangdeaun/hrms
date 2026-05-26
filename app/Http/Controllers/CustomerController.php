<?php

namespace App\Http\Controllers;

use App\Models\CRM\Customer;
use App\Models\CRM\Contact;
use App\Services\DocumentNumberService;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    protected $numberService;
    protected $imageService;

    public function __construct(DocumentNumberService $numberService, ImageService $imageService)
    {
        $this->numberService = $numberService;
        $this->imageService = $imageService;
    }

    public function index(Request $request)
    {
        $query = Customer::with(['customer_type', 'parent']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('customer_no', 'like', "%{$search}%")
                  ->orWhere('customer_code', 'like', "%{$search}%");
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('customer_type_id')) {
            $query->where('customer_type_id', $request->customer_type_id);
        }

        if ($request->has('all') || $request->paginate === 'false') {
            $customers = $query->select(['id', 'name', 'phone', 'customer_code', 'customer_no', 'customer_type_id', 'parent_id', 'image', 'source'])
                         ->latest()->get();
            return \App\Http\Resources\CRM\CustomerResource::collection($customers);
        }

        return \App\Http\Resources\CRM\CustomerResource::collection($query->latest()->paginate($request->per_page ?? 15));
    }

    public function store(Request $request)
    {

        $validated = $request->validate([
            'customer_code' => 'required|string|max:50|unique:customers,customer_code',
            'type' => 'nullable|string|max:50',
            'name' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:customers,id',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'telegram_user_id' => 'nullable|string|max:50',
            'joined_at' => 'nullable|date',
            'customer_type_id' => 'required|exists:customer_types,id',
            'status' => 'required|in:ACTIVE,INACTIVE',
            'notes' => 'nullable|string',
            'image' => 'nullable',
            'source' => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $validated['joined_at'] = $validated['joined_at'] ?? now();
            
            if ($request->hasFile('image')) {
                $path = $this->imageService->compressToWebp($request->file('image'), 'crm/customers');
                $validated['image'] = $path;
            }

            $customer = Customer::create($validated);

            // Advance the document counter so the next preview() returns the correct next code.
            // The generated value is discarded — the code from the form is already stored above.
            $this->numberService->generate('customer_code');

            return $customer;
        });
    }

    public function show(Customer $customer)
    {
        return $customer->load(['customer_type', 'parent', 'children', 'vehicles']);
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'customer_code' => 'required|string|max:50|unique:customers,customer_code,' . $customer->id,
            'type' => 'nullable|string|max:50',
            'name' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:customers,id',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'telegram_user_id' => 'nullable|string|max:50',
            'joined_at' => 'nullable|date',
            'customer_type_id' => 'required|exists:customer_types,id',
            'status' => 'required|in:ACTIVE,INACTIVE',
            'notes' => 'nullable|string',
            'image' => 'nullable',
            'source' => 'nullable|string|max:255',
        ]);

        if ($request->hasFile('image')) {
            $path = $this->imageService->compressToWebp($request->file('image'), 'crm/customers');
            $validated['image'] = $path;
        }

        $customer->update($validated);
        return $customer->load(['customer_type', 'parent']);
    }

    public function destroy(Customer $customer)
    {
        return DB::transaction(function () use ($customer) {
            // Find any contact promoted to this customer and reset its status
            Contact::where('promoted_customer_id', $customer->id)
                ->update([
                    'is_converted' => false,
                    'promoted_customer_id' => null
                ]);

            $customer->delete();
            return response()->json(null, 204);
        });
    }

    public function getNextCode()
    {
        $nextCode = $this->numberService->preview('customer_code');
        return response()->json([
            'next_code' => $nextCode
        ]);
    }
}


