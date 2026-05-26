<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Procurement\PurchaseReceive;
use App\Models\Procurement\PurchaseReceiveItem;
use App\Models\Procurement\PurchaseOrderItem;
use App\Models\Stock\Stock;
use App\Models\Inventory\Product;
use App\Services\Inventory\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseReceiveController extends Controller
{
    protected $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    public function index(Request $request)
    {
        $query = PurchaseReceive::with([
            'purchaseOrder.supplier',
            'location',
            'items.product',
            'creator'
        ]);

        if ($request->filled('start_date')) {
            $query->whereDate('receive_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('receive_date', '<=', $request->end_date);
        }
        if ($request->filled('location_id') && $request->location_id !== 'all') {
            $query->where('location_id', $request->location_id);
        }
        if ($request->filled('branch_id') && $request->branch_id !== 'all') {
            $branchId = $request->branch_id;
            if (is_string($branchId) && str_contains($branchId, ',')) {
                $branchId = explode(',', $branchId);
            }
            $query->whereHas('location', function ($q) use ($branchId) {
                if (is_array($branchId)) {
                    $q->whereIn('branch_id', $branchId);
                } else {
                    $q->where('branch_id', $branchId);
                }
            });
        }
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $receives = $query->orderBy('created_at', 'desc')->get();

        return response()->json($receives);
    }

    public function store(Request $request, \App\Services\DocumentNumberService $documentNumberService)
    {
        $validated = $request->validate([
            'purchase_order_id'      => 'required|exists:inventory_purchase_orders,id',
            'location_id'            => 'required|exists:inventory_locations,id',
            'receive_date'           => 'required|date',
            'reference_number'       => 'nullable|string|max:255',
            'receiving_note'         => 'nullable|string',
            'items'                  => 'required|array|min:1',
            'items.*.purchase_order_item_id' => 'required|exists:inventory_purchase_order_items,id',
            'items.*.product_id'     => 'required|exists:inventory_products,id',
            'items.*.qty_received'   => 'required|numeric|min:0.01',
        ]);

        DB::transaction(function () use ($validated, $documentNumberService, &$receive) {
            $receiveNumber = $documentNumberService->generate('purchase_receive');

            $receive = PurchaseReceive::create([
                'purchase_order_id' => $validated['purchase_order_id'],
                'location_id'       => $validated['location_id'],
                'receive_number'    => $receiveNumber,
                'receive_date'      => $validated['receive_date'],
                'reference_number'  => $validated['reference_number'] ?? null,
                'receiving_note'    => $validated['receiving_note'] ?? null,
                'status'            => 'Received',
                'created_by'        => auth()->id(),
            ]);

            foreach ($validated['items'] as $item) {
                // Get product to check UOM multiplier for base unit stock update
                $product = Product::find($item['product_id']);
                $multiplier = $product ? ($product->uom_multiplier ?: 1) : 1;
                $qtyInBaseUom = (float) $item['qty_received'] * $multiplier;

                // Save PR item (stores qty in purchase UOM)
                PurchaseReceiveItem::create([
                    'purchase_receive_id'    => $receive->id,
                    'purchase_order_item_id' => $item['purchase_order_item_id'],
                    'product_id'             => $item['product_id'],
                    'qty_received'           => $item['qty_received'],
                ]);

                // ============================================================
                // UPDATE STOCK & LOG MOVEMENT (Uses Base UOM)
                // ============================================================
                $this->stockService->updateStock(
                    $item['product_id'],
                    $validated['location_id'],
                    $qtyInBaseUom,
                    'PURCHASE_RECEIVE',
                    $receive,
                    $validated['receiving_note'] ?? "Received from PO #{$receive->purchaseOrder?->po_number}"
                );

                // Update received_qty on the PO Item
                $poItem = PurchaseOrderItem::find($item['purchase_order_item_id']);
                if ($poItem) {
                    $poItem->increment('received_qty', $item['qty_received']);

                    // If the PO item is fully received, check if entire PO is complete
                    $poItem->refresh();
                }
            }

            // Auto-update PO status: Partial or Completed
            $po = $receive->purchaseOrder()->with('items')->first();
            $allFulfilled = $po->items->every(function ($i) {
                return $i->received_qty >= $i->order_qty;
            });
            $anyFulfilled = $po->items->some(function ($i) {
                return $i->received_qty > 0;
            });

            if ($allFulfilled) {
                $po->update(['status' => 'Completed']);
            } elseif ($anyFulfilled) {
                $po->update(['status' => 'Partial']);
            }
        });

        // Broadcast to Telegram
        resolve(\App\Services\TelegramService::class)->broadcast('procurement.receive_completed', $receive->load(['purchaseOrder.supplier', 'location', 'items.product']));

        return response()->json($receive->load(['purchaseOrder.supplier', 'location', 'items.product']), 201);
    }

    public function show($id)
    {
        $receive = PurchaseReceive::with([
            'purchaseOrder.supplier',
            'location',
            'items.product',
            'items.poItem',
        ])->findOrFail($id);

        return response()->json($receive);
    }

    public function destroy($id)
    {
        $receive = PurchaseReceive::findOrFail($id);
        // Only allow deleting draft receives
        if ($receive->status !== 'Draft') {
            return response()->json(['message' => 'Cannot delete a confirmed receipt.'], 422);
        }
        $receive->delete();
        return response()->json(['message' => 'Purchase Receive deleted successfully']);
    }

    /**
     * Returns the unfulfilled items for a given PO — to pre-fill the PR form.
     */
    public function getPendingItems($poId)
    {
        $items = PurchaseOrderItem::with(['product.purchaseUom', 'product.baseUom'])
            ->where('purchase_order_id', $poId)
            ->get()
            ->map(function ($item) {
                return [
                    'id'             => $item->id,
                    'product'        => $item->product,
                    'order_qty'      => $item->order_qty,
                    'received_qty'   => $item->received_qty,
                    'remaining_qty'  => max(0, $item->order_qty - $item->received_qty),
                ];
            });

        return response()->json($items);
    }
}


