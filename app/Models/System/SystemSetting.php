<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class SystemSetting extends Model
{
    use HasFactory, LogsSystemActivity;

    protected $fillable = [
        'key',
        'value',
        'type',
    ];

    /**
     * Get a setting value by key with optional default.
     */
    public static function get(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        if (!$setting) {
            return $default;
        }

        return self::castValue($setting->value, $setting->type);
    }

    /**
     * Set a setting value by key.
     */
    public static function set(string $key, $value, string $type = 'string')
    {
        return self::updateOrCreate(
            ['key' => $key],
            [
                'value' => is_array($value) ? json_encode($value) : $value,
                'type' => $type
            ]
        );
    }

    /**
     * Cast value based on type.
     */
    protected static function castValue($value, $type)
    {
        if (is_null($value)) return null;

        switch ($type) {
            case 'json':
            case 'array':
                return json_decode($value, true);
            case 'boolean':
            case 'bool':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            case 'integer':
            case 'int':
                return (int) $value;
            case 'float':
            case 'double':
                return (float) $value;
            default:
                return $value;
        }
    }
}



