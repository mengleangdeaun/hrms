<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait BelongsToCompany
{
    public static ?string $companyIdForSeeding = null;

    /**
     * Boot the belongs to company trait.
     */
    public static function bootBelongsToCompany(): void
    {
        static::creating(function ($model) {
            if (!$model->company_id) {
                if (\App\Traits\BelongsToCompany::$companyIdForSeeding) {
                    $model->company_id = \App\Traits\BelongsToCompany::$companyIdForSeeding;
                } elseif (Auth::check()) {
                    $user = Auth::user();
                    if (isset($user->company_id)) {
                        $model->company_id = $user->company_id;
                    }
                }
            }
        });

        static::addGlobalScope('company_isolation', function (Builder $builder) {
            if (Auth::check()) {
                $user = Auth::user();
                if (isset($user->company_id)) {
                    $table = $builder->getModel()->getTable();
                    $builder->where($table . '.company_id', $user->company_id);
                }
            }
        });
    }
}
