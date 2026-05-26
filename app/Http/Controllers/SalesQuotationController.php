<?php

namespace App\Http\Controllers;

use App\Models\Sales\SalesQuotation;
use App\Models\Sales\SalesOrder;
use App\Models\Sales\SalesOrderItem;
use App\Models\Sales\SalesInvoice;
use App\Services\DocumentNumberService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class SalesQuotationController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesQuotation::with(['customer:id,name,customer_code']);

        if ($request->from_date && $request->to_date) {
            $query->whereBetween('quotation_date', [$request->from_date, $request->to_date]);
        }

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('branch_id')) {
            $branchIds = is_array($request->branch_id) 
                ? $request->branch_id 
                : explode(',', $request->branch_id);
            $query->whereIn('branch_id', $branchIds);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('quotation_no', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        return $query->latest('quotation_date')->paginate($request->per_page ?? 15);
    }

    public function store(Request $request, DocumentNumberService $documentNumberService)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'branch_id' => 'required|exists:branches,id',
            'vehicle_id' => 'nullable|exists:customer_vehicles,id',
            'quotation_date' => 'required|date',
            'expiry_date' => 'nullable|date',
            'subtotal' => 'required|numeric',
            'subtotal_khr' => 'nullable|numeric',
            'tax_total' => 'required|numeric',
            'discount_total' => 'required|numeric',
            'grand_total' => 'required|numeric',
            'grand_total_khr' => 'nullable|numeric',
            'exchange_rate' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_name' => 'nullable|string',
            'items.*.product_id' => 'nullable|exists:inventory_products,id',
            'items.*.service_id' => 'nullable|exists:services,id',
            'items.*.job_part_id' => 'nullable|exists:job_parts_master,id',
            'items.*.qty' => 'required|numeric',
            'items.*.unit_price' => 'required|numeric',
            'items.*.discount' => 'nullable|numeric',
            'items.*.tax_percent' => 'nullable|numeric',
        ]);

        return DB::transaction(function () use ($validated, $documentNumberService) {
            $exchangeRate = $validated['exchange_rate'] ?? 4100;
            
            $quotation = SalesQuotation::create(array_merge(
                collect($validated)->except(['items'])->toArray(),
                [
                    'quotation_no' => $documentNumberService->generate('quote', $validated['branch_id']),
                    'subtotal_khr' => $validated['subtotal_khr'] ?? ($validated['subtotal'] * $exchangeRate),
                    'grand_total_khr' => $validated['grand_total_khr'] ?? ($validated['grand_total'] * $exchangeRate),
                    'exchange_rate' => $exchangeRate,
                    'status' => 'DRAFT',
                    'created_by' => Auth::id() ?? 1,
                ]
            ));

            foreach ($validated['items'] as $itemData) {
                $quotation->items()->create([
                    'itemable_id' => $itemData['service_id'] ?? $itemData['product_id'],
                    'itemable_type' => !empty($itemData['service_id']) ? \App\Models\Workshop\Service::class : \App\Models\Inventory\Product::class,
                    'product_id' => $itemData['product_id'] ?? null,
                    'job_part_id' => $itemData['job_part_id'] ?? null,
                    'item_name' => $itemData['item_name'] ?? ($itemData['service_id'] ? 'Service' : 'Product'),
                    'quantity' => $itemData['qty'],
                    'unit_price' => $itemData['unit_price'],
                    'discount_amount' => $itemData['discount'] ?? 0,
                    'tax_amount' => 0,
                    'subtotal' => ($itemData['qty'] * $itemData['unit_price']) - ($itemData['discount'] ?? 0),
                ]);
            }

            return $quotation->load('items');
        });
    }

    public function show($id)
    {
        return SalesQuotation::with([
            'customer:id,name,phone,address,customer_code', 
            'branch:id,name,address,city,phone,logo_url', 
            'items.itemable', 
            'creator:id,name', 
            'vehicle.brand:id,name', 
            'vehicle.model:id,name'
        ])->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $quotation = SalesQuotation::findOrFail($id);
        
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'branch_id' => 'required|exists:branches,id',
            'vehicle_id' => 'nullable|exists:customer_vehicles,id',
            'quotation_date' => 'required|date',
            'expiry_date' => 'nullable|date',
            'subtotal' => 'required|numeric',
            'subtotal_khr' => 'nullable|numeric',
            'tax_total' => 'required|numeric',
            'discount_total' => 'required|numeric',
            'grand_total' => 'required|numeric',
            'grand_total_khr' => 'nullable|numeric',
            'status' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'exchange_rate' => 'nullable|numeric',
        ]);

        return DB::transaction(function () use ($validated, $quotation) {
            $exchangeRate = $validated['exchange_rate'] ?? $quotation->exchange_rate;

            $quotation->update(array_merge(
                collect($validated)->except(['items'])->toArray(),
                [
                    'subtotal_khr' => $validated['subtotal_khr'] ?? ($validated['subtotal'] * $exchangeRate),
                    'grand_total_khr' => $validated['grand_total_khr'] ?? ($validated['grand_total'] * $exchangeRate),
                    'exchange_rate' => $exchangeRate,
                ]
            ));

            $quotation->items()->delete();

            foreach ($validated['items'] as $itemData) {
                $quotation->items()->create([
                    'itemable_id' => $itemData['service_id'] ?? $itemData['product_id'],
                    'itemable_type' => !empty($itemData['service_id']) ? \App\Models\Workshop\Service::class : \App\Models\Inventory\Product::class,
                    'product_id' => $itemData['product_id'] ?? null,
                    'job_part_id' => $itemData['job_part_id'] ?? null,
                    'item_name' => $itemData['item_name'] ?? 'Item',
                    'quantity' => $itemData['qty'],
                    'unit_price' => $itemData['unit_price'],
                    'discount_amount' => $itemData['discount'] ?? 0,
                    'tax_amount' => 0,
                    'subtotal' => ($itemData['qty'] * $itemData['unit_price']) - ($itemData['discount'] ?? 0),
                ]);
            }

            return $quotation->load('items');
        });
    }

    public function destroy($id)
    {
        $quotation = SalesQuotation::findOrFail($id);
        $quotation->delete();
        return response()->json(['message' => 'Quotation deleted successfully']);
    }

    public function convertToOrder($id, DocumentNumberService $documentNumberService)
    {
        $quotation = SalesQuotation::with('items')->findOrFail($id);

        if ($quotation->status === 'CONVERTED') {
            return response()->json(['message' => 'Quotation already converted'], 422);
        }

        return DB::transaction(function () use ($quotation, $documentNumberService) {
            // 1. Create Sales Order
            $order = SalesOrder::create([
                'order_no' => $documentNumberService->generate('sales_order', $quotation->branch_id),
                'customer_id' => $quotation->customer_id,
                'branch_id' => $quotation->branch_id,
                'vehicle_id' => $quotation->vehicle_id,
                'order_date' => now(),
                'subtotal' => $quotation->subtotal,
                'subtotal_khr' => $quotation->subtotal_khr,
                'tax_total' => $quotation->tax_total,
                'discount_total' => $quotation->discount_total,
                'grand_total' => $quotation->grand_total,
                'grand_total_khr' => $quotation->grand_total_khr,
                'taxable_amount' => $quotation->subtotal - $quotation->discount_total,
                'tax_percent' => ($quotation->tax_total / ($quotation->subtotal ?: 1)) * 100,
                'paid_amount' => 0,
                'balance_amount' => $quotation->grand_total,
                'status' => 'PENDING',
                'payment_status' => 'UNPAID',
                'notes' => $quotation->notes,
                'created_by' => Auth::id() ?? 1,
                'exchange_rate' => $quotation->exchange_rate,
            ]);

            // 2. Create Order Items
            foreach ($quotation->items as $item) {
                $order->items()->create([
                    'itemable_id' => $item->itemable_id,
                    'itemable_type' => $item->itemable_type,
                    'product_id' => $item->product_id,
                    'job_part_id' => $item->job_part_id,
                    'item_name' => $item->item_name,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'discount_amount' => $item->discount_amount,
                    'tax_amount' => $item->tax_amount,
                    'subtotal' => $item->subtotal,
                ]);
            }

            // 3. Mark Quotation as converted
            $quotation->update(['status' => 'CONVERTED']);

            return response()->json([
                'message' => 'Quotation converted to Sales Order successfully',
                'order_id' => $order->id,
                'order_no' => $order->order_no
            ]);
        });
    }
}
