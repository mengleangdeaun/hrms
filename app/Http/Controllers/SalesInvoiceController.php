<?php

namespace App\Http\Controllers;

use App\Models\Sales\SalesInvoice;
use Illuminate\Http\Request;

class SalesInvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesInvoice::with(['customer', 'branch', 'order', 'creator']);

        if ($request->from_date && $request->to_date) {
            $query->whereBetween('invoice_date', [$request->from_date, $request->to_date]);
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

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('invoice_no', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        return $query->latest('invoice_date')->paginate($request->per_page ?? 15);
    }

    public function show($id)
    {
        return SalesInvoice::with(['customer', 'branch', 'order.items.itemable', 'creator'])->findOrFail($id);
    }
}
