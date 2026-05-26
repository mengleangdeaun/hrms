<?php

namespace App\Http\Controllers\Inventory;

use App\Models\Stock\Location;

use App\Http\Controllers\Controller;
use App\Models\Inventory\Product;
use App\Models\Stock\Stock;
use App\Models\Stock\StockMovement;
use App\Models\Inventory\ProductSerial;
use App\Models\HR\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuperAdmin = method_exists($user, 'hasRole') && $user->hasRole('super-admin');
        $branchId = $request->query('branch_id');

        $authorizedBranchIds = [];
        if (!$isSuperAdmin) {
            if (method_exists($user, 'branches')) {
                $authorizedBranchIds = $user->branches()->pluck('branches.id')->toArray();
            }
            if (empty($authorizedBranchIds) && isset($user->branch_id)) {
                $authorizedBranchIds = [$user->branch_id];
            }
        }

        // Closure to apply branch filter to various queries
        $applyBranchFilter = function($query, $tableAlias = null) use ($branchId, $authorizedBranchIds, $isSuperAdmin) {
            $column = $tableAlias ? "{$tableAlias}.branch_id" : 'branch_id';
            
            $query->where(function($q) use ($branchId, $authorizedBranchIds, $isSuperAdmin, $column) {
                if (!$isSuperAdmin) {
                    if (empty($authorizedBranchIds)) {
                        $q->whereRaw('1 = 0');
                    } else {
                        $q->whereIn($column, $authorizedBranchIds);
                    }
                }
                
                if ($branchId) {
                    if (is_array($branchId)) {
                        $q->whereIn($column, $branchId);
                    } else {
                        $q->where($column, $branchId);
                    }
                }
            });
        };

        // 1. Overview Stats
        $productQuery = Product::query();
        if (!$isSuperAdmin || $branchId) {
            $productQuery->whereHas('branches', function($q) use ($applyBranchFilter) {
                $applyBranchFilter($q);
            });
        }
        $totalProducts = $productQuery->count();
        $activeProducts = (clone $productQuery)->where('is_active', true)->count();
        
        // Total Stock Value (quantity * product cost)
        $stockValueQuery = Stock::join('inventory_products', 'inventory_stocks.product_id', '=', 'inventory_products.id')
            ->join('inventory_locations', 'inventory_stocks.location_id', '=', 'inventory_locations.id');
            
        if (!$isSuperAdmin || $branchId) {
            $applyBranchFilter($stockValueQuery, 'inventory_locations');
        } else {
            $stockValueQuery->join('branches', 'inventory_locations.branch_id', '=', 'branches.id')
                ->where('branches.status', 'active');
        }

        $totalStockValue = $stockValueQuery->select(DB::raw('SUM(inventory_stocks.quantity * inventory_products.cost) as total_value'))
            ->value('total_value') ?? 0;

        // Low Stock Count & Products
        $lowStockQuery = Product::with(['category', 'baseUom']);
        
        $effectiveBranchIds = $branchId ? (is_array($branchId) ? $branchId : [$branchId]) : $authorizedBranchIds;
        $hasBranchConstraint = !$isSuperAdmin || !empty($effectiveBranchIds);

        if ($hasBranchConstraint) {
            $branchList = implode(',', array_map('intval', $effectiveBranchIds));
            $lowStockQuery->whereHas('branches', function($q) use ($effectiveBranchIds) {
                $q->whereIn('branch_id', $effectiveBranchIds);
            })
            ->whereRaw("
                COALESCE((SELECT SUM(quantity) 
                 FROM inventory_stocks 
                 JOIN inventory_locations ON inventory_stocks.location_id = inventory_locations.id 
                 WHERE inventory_stocks.product_id = inventory_products.id 
                 AND inventory_locations.branch_id IN ({$branchList})), 0)
                < COALESCE(
                    (SELECT SUM(reorder_level) 
                     FROM branch_inventory_product 
                     WHERE branch_id IN ({$branchList}) AND inventory_product_id = inventory_products.id),
                    inventory_products.reorder_level
                )
            ")
            ->select('inventory_products.*')
            ->addSelect(DB::raw("
                COALESCE((SELECT SUM(quantity) 
                 FROM inventory_stocks 
                 JOIN inventory_locations ON inventory_stocks.location_id = inventory_locations.id 
                 WHERE inventory_stocks.product_id = inventory_products.id 
                 AND inventory_locations.branch_id IN ({$branchList})), 0) as current_stock
            "))
            ->addSelect(DB::raw("
                COALESCE(
                    (SELECT SUM(reorder_level) 
                     FROM branch_inventory_product 
                     WHERE branch_id IN ({$branchList}) AND inventory_product_id = inventory_products.id),
                    inventory_products.reorder_level
                ) as target_reorder_level
            "));
        } else {
            // All active branches for super admin
            $lowStockQuery->whereRaw('
                (SELECT COALESCE(SUM(s.quantity), 0) 
                 FROM inventory_stocks s
                 JOIN inventory_locations l ON s.location_id = l.id 
                 JOIN branches b ON l.branch_id = b.id
                 WHERE s.product_id = inventory_products.id 
                 AND b.status = "active")
                < 
                (SELECT COALESCE(SUM(COALESCE(bip.reorder_level, inventory_products.reorder_level)), inventory_products.reorder_level)
                 FROM branches b
                 LEFT JOIN branch_inventory_product bip ON bip.branch_id = b.id AND bip.inventory_product_id = inventory_products.id
                 WHERE b.status = "active")
            ')
            ->select('inventory_products.*')
            ->addSelect(DB::raw("
                COALESCE((SELECT SUM(quantity) 
                 FROM inventory_stocks 
                 JOIN inventory_locations ON inventory_stocks.location_id = inventory_locations.id 
                 JOIN branches ON inventory_locations.branch_id = branches.id
                 WHERE inventory_stocks.product_id = inventory_products.id
                 AND branches.status = 'active'), 0) as current_stock
            "))
            ->addSelect(DB::raw("
                COALESCE(
                    (SELECT SUM(COALESCE(bip.reorder_level, inventory_products.reorder_level))
                     FROM branches b
                     LEFT JOIN branch_inventory_product bip ON bip.branch_id = b.id AND bip.inventory_product_id = inventory_products.id
                     WHERE b.status = 'active'),
                    inventory_products.reorder_level
                ) as target_reorder_level
            "));
        }

        $lowStockCount = (clone $lowStockQuery)->count();
        $lowStockProducts = $lowStockQuery->limit(20)->get();

        // 2. Stock Distribution
        if ($branchId && !is_array($branchId)) {
            $distribution = \App\Models\Stock\Location::where('branch_id', $branchId)
                ->with('stocks')
                ->get()
                ->map(function ($location) {
                    return [
                        'name' => $location->name,
                        'quantity' => $location->stocks->sum('quantity')
                    ];
                });
            $distributionTitle = "Stock by Location";
        } else {
            $distQuery = Branch::where('status', 'active')->with(['locations.stocks']);
            
            if (!$isSuperAdmin || $branchId) {
                if (!$isSuperAdmin) {
                    $distQuery->whereIn('id', $authorizedBranchIds);
                }
                if ($branchId) {
                    if (is_array($branchId)) {
                        $distQuery->whereIn('id', $branchId);
                    } else {
                        $distQuery->where('id', $branchId);
                    }
                }
            }

            $distribution = $distQuery->get()
                ->map(function ($branch) {
                    $totalQuantity = $branch->locations->flatMap->stocks->sum('quantity');
                    return [
                        'name' => $branch->name,
                        'quantity' => $totalQuantity
                    ];
                });
            $distributionTitle = "Stock by Branch";
        }

        // 3. Category Distribution
        $catDistQuery = DB::table('inventory_categories')
            ->leftJoin('inventory_products', 'inventory_categories.id', '=', 'inventory_products.category_id')
            ->leftJoin('inventory_stocks', function($join) use ($branchId, $authorizedBranchIds, $isSuperAdmin) {
                $join->on('inventory_products.id', '=', 'inventory_stocks.product_id')
                     ->join('inventory_locations', 'inventory_stocks.location_id', '=', 'inventory_locations.id');
                
                if (!$isSuperAdmin || $branchId) {
                    if (!$isSuperAdmin) {
                        if (empty($authorizedBranchIds)) {
                            $join->whereRaw('1 = 0');
                        } else {
                            $join->whereIn('inventory_locations.branch_id', $authorizedBranchIds);
                        }
                    }
                    if ($branchId) {
                        if (is_array($branchId)) {
                            $join->whereIn('inventory_locations.branch_id', $branchId);
                        } else {
                            $join->where('inventory_locations.branch_id', '=', $branchId);
                        }
                    }
                } else {
                     $join->join('branches', 'inventory_locations.branch_id', '=', 'branches.id')
                          ->where('branches.status', '=', 'active');
                }
            });

        $categoryDistribution = $catDistQuery
            ->select('inventory_categories.name', DB::raw('SUM(COALESCE(inventory_stocks.quantity, 0)) as total_quantity'))
            ->groupBy('inventory_categories.id', 'inventory_categories.name')
            ->get();

        // 4. Recent Movements
        $movementQuery = StockMovement::with(['product', 'location.branch', 'user'])
            ->orderBy('created_at', 'desc');

        if (!$isSuperAdmin || $branchId) {
            $movementQuery->whereHas('location', function($q) use ($applyBranchFilter) {
                $applyBranchFilter($q);
            });
        }

        if (request('start_date') && request('end_date')) {
            $movementQuery->whereBetween('created_at', [
                request('start_date') . ' 00:00:00',
                request('end_date') . ' 23:59:59'
            ]);
        }
        $recentMovements = $movementQuery->limit(20)->get();

        // 5. Serial Stats (Rolls)
        $serialQuery = ProductSerial::query();
        if (!$isSuperAdmin || $branchId) {
            $serialQuery->whereHas('location', function($q) use ($applyBranchFilter) {
                $applyBranchFilter($q);
            });
        }
        $totalRolls = (clone $serialQuery)->count();
        $availableRolls = (clone $serialQuery)->where('status', 'available')->count();
        $consumedRolls = (clone $serialQuery)->where('status', 'consumed')->count();
        
        // Consumption rate (Estimated based on last 30 days movements)
        $thirtyDaysAgo = now()->subDays(30);
        $consumptionQuery = StockMovement::where('movement_type', 'out')
            ->where('created_at', '>=', $thirtyDaysAgo);
        
        if (!$isSuperAdmin || $branchId) {
            $consumptionQuery->whereHas('location', function($q) use ($applyBranchFilter) {
                $applyBranchFilter($q);
            });
        }
        $consumptionLastMonth = $consumptionQuery->sum('quantity');

        // 6. Movement Trends
        $startDate = request('start_date') ? \Carbon\Carbon::parse(request('start_date')) : now()->subDays(30);
        $endDate = request('end_date') ? \Carbon\Carbon::parse(request('end_date')) : now();
        
        $days = $startDate->diffInDays($endDate) + 1;
        if ($days > 90) $days = 90;

        $trends = [];
        for ($i = 0; $i < $days; $i++) {
            $date = (clone $startDate)->addDays($i)->format('Y-m-d');
            $trends[$date] = [
                'date' => $date,
                'in' => 0,
                'out' => 0
            ];
        }

        $movementTrendsQuery = DB::table('inventory_stock_movements')
            ->join('inventory_locations', 'inventory_stock_movements.location_id', '=', 'inventory_locations.id')
            ->select(
                DB::raw('DATE(inventory_stock_movements.created_at) as date'),
                'movement_type',
                DB::raw('SUM(quantity) as total_qty')
            )
            ->whereBetween('inventory_stock_movements.created_at', [
                $startDate->format('Y-m-d') . ' 00:00:00',
                $endDate->format('Y-m-d') . ' 23:59:59'
            ])
            ->groupBy('date', 'movement_type');

        if (!$isSuperAdmin || $branchId) {
            $applyBranchFilter($movementTrendsQuery, 'inventory_locations');
        } else {
            $movementTrendsQuery->join('branches', 'inventory_locations.branch_id', '=', 'branches.id')
                ->where('branches.status', 'active');
        }

        $movementTrendsData = $movementTrendsQuery->get();

        foreach ($movementTrendsData as $row) {
            if (isset($trends[$row->date])) {
                $type = (float)$row->total_qty >= 0 ? 'in' : 'out';
                $trends[$row->date][$type] += (float)abs($row->total_qty);
            }
        }

        return response()->json([
            'overview' => [
                'total_products' => $totalProducts,
                'active_products' => $activeProducts,
                'total_stock_value' => (float)$totalStockValue,
                'low_stock_count' => $lowStockCount,
                'low_stock_products' => $lowStockProducts,
            ],
            'distribution' => [
                'title' => $distributionTitle,
                'data' => $distribution
            ],
            'category_distribution' => $categoryDistribution,
            'movement_trends' => array_values($trends),
            'recent_movements' => $recentMovements,
            'serial_stats' => [
                'total_rolls' => $totalRolls,
                'available_rolls' => $availableRolls,
                'consumed_rolls' => $consumedRolls,
                'monthly_consumption' => (float)$consumptionLastMonth,
            ]
        ]);
    }
}


