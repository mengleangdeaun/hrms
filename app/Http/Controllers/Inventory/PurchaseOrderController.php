<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Procurement\PurchaseOrder;
use App\Models\Procurement\PurchaseOrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseOrder::with(['supplier', 'branch', 'items.product', 'creator']);

        if ($request->filled('start_date')) {
            $query->whereDate('order_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('order_date', '<=', $request->end_date);
        }
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        if ($request->filled('supplier_id') && $request->supplier_id !== 'all') {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->filled('branch_id')) {
            $branchIds = is_array($request->branch_id) 
                ? $request->branch_id 
                : explode(',', $request->branch_id);
            $query->whereIn('branch_id', $branchIds);
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        return response()->json($orders);
    }

    public function store(Request $request, \App\Services\DocumentNumberService $documentNumberService)
    {
        $validated = $request->validate([
            'supplier_id'            => 'required|exists:inventory_suppliers,id',
            'branch_id'              => 'required|exists:branches,id',
            'order_date'             => 'required|date',
            'expected_delivery_date' => 'nullable|date',
            'status'                 => 'in:Draft,Ordered,Partial,Completed,Cancelled',
            'note'                   => 'nullable|string',
            'items'                  => 'required|array|min:1',
            'items.*.product_id'     => 'required|exists:inventory_products,id',
            'items.*.order_qty'      => 'required|numeric|min:0.01',
            'items.*.unit_cost'      => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $request, $documentNumberService, &$order) {
            // Auto-generate PO number
            $poNumber = $documentNumberService->generate('purchase_order', $validated['branch_id']);

            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += $item['order_qty'] * $item['unit_cost'];
            }

            $order = PurchaseOrder::create([
                'supplier_id'            => $validated['supplier_id'],
                'branch_id'              => $validated['branch_id'],
                'po_number'              => $poNumber,
                'order_date'             => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'status'                 => $validated['status'] ?? 'Draft',
                'total_amount'           => $totalAmount,
                'note'                   => $validated['note'] ?? null,
                'created_by'             => auth()->id(),
            ]);

            foreach ($validated['items'] as $item) {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $order->id,
                    'product_id'        => $item['product_id'],
                    'order_qty'         => $item['order_qty'],
                    'unit_cost'         => $item['unit_cost'],
                    'total_cost'        => $item['order_qty'] * $item['unit_cost'],
                    'received_qty'      => 0,
                ]);
            }
        });

        // Broadcast to Telegram
        if ($order->status !== 'Draft') {
            resolve(\App\Services\TelegramService::class)->broadcast('procurement.po_created', $order->load(['supplier', 'items.product']));
        }

        return response()->json($order->load(['supplier', 'branch', 'items.product']), 201);
    }

    public function show($id)
    {
        $order = PurchaseOrder::with(['supplier', 'branch', 'items.product'])->findOrFail($id);
        return response()->json($order);
    }

    public function update(Request $request, $id)
    {
        $order = PurchaseOrder::findOrFail($id);

        if (in_array($order->status, ['Completed', 'Cancelled'])) {
            return response()->json(['message' => 'Cannot edit a Completed or Cancelled PO.'], 422);
        }

        $oldStatus = $order->status;

        $validated = $request->validate([
            'supplier_id'            => 'sometimes|exists:inventory_suppliers,id',
            'branch_id'              => 'sometimes|exists:branches,id',
            'order_date'             => 'sometimes|date',
            'expected_delivery_date' => 'nullable|date',
            'status'                 => 'sometimes|in:Draft,Ordered,Partial,Completed,Cancelled',
            'note'                   => 'nullable|string',
            'items'                  => 'sometimes|array|min:1',
            'items.*.product_id'     => 'required_with:items|exists:inventory_products,id',
            'items.*.order_qty'      => 'required_with:items|numeric|min:0.01',
            'items.*.unit_cost'      => 'required_with:items|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $order) {
            if (isset($validated['items'])) {
                $order->items()->delete();

                $totalAmount = 0;
                foreach ($validated['items'] as $item) {
                    $totalAmount += $item['order_qty'] * $item['unit_cost'];
                    PurchaseOrderItem::create([
                        'purchase_order_id' => $order->id,
                        'product_id'        => $item['product_id'],
                        'order_qty'         => $item['order_qty'],
                        'unit_cost'         => $item['unit_cost'],
                        'total_cost'        => $item['order_qty'] * $item['unit_cost'],
                        'received_qty'      => 0,
                    ]);
                }
                $validated['total_amount'] = $totalAmount;
                unset($validated['items']);
            }

            $order->update($validated);
        });

        if ($oldStatus === 'Draft' && $order->status !== 'Draft') {
            resolve(\App\Services\TelegramService::class)->broadcast('procurement.po_created', $order->fresh()->load(['supplier', 'items.product']));
        }

        return response()->json($order->fresh()->load(['supplier', 'branch', 'items.product']));
    }

    public function followUp($id)
    {
        $order = PurchaseOrder::with(['supplier', 'items.product', 'creator'])->findOrFail($id);

        if (in_array($order->status, ['Completed', 'Cancelled', 'Draft'])) {
            return response()->json(['message' => 'This PO is not eligible for follow-up.'], 422);
        }

        $telegramService = resolve(\App\Services\TelegramService::class);
        
        $config = \App\Models\Communication\TelegramBroadcastAction::where('action_key', 'procurement.po_created')
            ->whereNull('branch_id')->first();
            
        if ($config && $config->is_enabled && $config->chat_id) {
            $telegramService->broadcast('procurement.po_followup', $order, [
                'chat_id' => $config->chat_id,
                'topic_id' => $config->topic_id
            ]);
            return response()->json(['message' => 'Follow up sent to Telegram successfully']);
        }
        
        return response()->json(['message' => 'Telegram broadcast is not configured for procurement.'], 400);
    }

    public function destroy($id)
    {
        $order = PurchaseOrder::findOrFail($id);

        if ($order->status !== 'Draft') {
            return response()->json(['message' => 'Only Draft POs can be deleted.'], 422);
        }

        $order->delete();
        return response()->json(['message' => 'Purchase Order deleted successfully']);
    }
}


