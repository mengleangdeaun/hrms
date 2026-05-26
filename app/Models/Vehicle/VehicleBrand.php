<?php

namespace App\Models\Vehicle;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use App\Traits\LogsSystemActivity;

class VehicleBrand extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'image', 'is_active'];

    protected $appends = ['image_url'];

    public function models()
    {
        return $this->hasMany(\App\Models\Vehicle\VehicleModel::class, 'brand_id');
    }

    public function getImageUrlAttribute()
    {
        if (!$this->image) {
            return null;
        }

        if (filter_var($this->image, FILTER_VALIDATE_URL)) {
            return $this->image;
        }

        // If the path starts with assets/, it's a static file in the public directory
        if (str_starts_with($this->image, 'assets/')) {
            return asset($this->image);
        }

        return Storage::url($this->image);
    }
}



