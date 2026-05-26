<?php
namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait ScopesByBranch
{
    /**
     * Boot the trait and apply the global scope.
     */
    protected static function bootScopesByBranch()
    {
        static::addGlobalScope('branch_isolation', function (Builder $builder) {
            $user = Auth::user();
            
            // 1. If not logged in (e.g., console or public routes if any), do not isolate yet 
            // or handle as needed. For CRM, we usually expect auth.
            if (!$user) {
                return;
            }

            // 2. Super Admins see all
            $isSuperAdmin = false;
            if (method_exists($user, 'hasRole') && $user->hasRole('super-admin')) {
                $isSuperAdmin = true;
            }

            if ($isSuperAdmin) {
                return;
            }

            // 3. If the user is a Customer, we don't apply branch isolation (they only see their own data via customer_id anyway)
            if ($user instanceof \App\Models\CRM\Customer) {
                return;
            }

            // 4. Determine assigned branch IDs based on user type
            $branchIds = [];

            if (method_exists($user, 'branches')) {
                // We use the relationship query directly to avoid lazy-loading issues 
                // and ensure we get the IDs from the pivot table correctly
                $branchIds = $user->branches()->pluck('branches.id')->toArray();
            }
            
            // Fallback for models/users that have a direct branch_id (like Employee)
            if (empty($branchIds) && isset($user->branch_id)) {
                $branchIds = [$user->branch_id];
            }
            
            if (empty($branchIds)) {
                // If the user has no branches assigned, they see nothing by default
                $builder->whereRaw('1 = 0');
                return;
            }

            // Use qualifyColumn to handle table aliases correctly in complex queries
            $builder->whereIn($builder->qualifyColumn('branch_id'), $branchIds);
        });
    }

    /**
     * Relationship to the Branch.
     */
    public function branch()
    {
        return $this->belongsTo(\App\Models\HR\Branch::class, 'branch_id');
    }
}
