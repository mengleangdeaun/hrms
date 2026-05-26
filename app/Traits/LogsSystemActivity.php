<?php

namespace App\Traits;

use App\Jobs\ProcessSystemActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait LogsSystemActivity
{
    /**
     * Boot the trait and register observers for creation, updating, and deleting.
     */
    protected static function bootLogsSystemActivity()
    {
        static::created(function ($model) {
            $model->logSystemActivity('created');
        });

        static::updated(function ($model) {
            $model->logSystemActivity('updated');
        });

        static::deleted(function ($model) {
            $model->logSystemActivity('deleted');
        });
    }

    /**
     * Actually write the log to the database via a background job.
     */
    public function logSystemActivity(string $event)
    {
        // Don't log if we're running in console (e.g., migrations/seeds) unless explicitly desired
        if (app()->runningInConsole() && !app()->runningUnitTests()) {
            return;
        }

        $causer = Auth::check() ? Auth::user() : null;
        $properties = [];

        if ($event === 'updated') {
            $dirty = $this->getDirty();
            
            // Don't log if nothing actually changed (e.g. save called but no dirty attributes)
            if (empty($dirty)) {
                return;
            }

            $properties = [
                'attributes' => $dirty,
                'old'        => array_intersect_key($this->getOriginal(), $dirty),
            ];
        } else if ($event === 'created') {
            $properties = [
                'attributes' => $this->getAttributes(),
            ];
        } else if ($event === 'deleted') {
            $properties = [
                'old' => $this->getOriginal(),
            ];
        }

        // Capture request context for audit trail
        $properties['ip'] = Request::ip();
        $properties['user_agent'] = Request::userAgent();
        
        // Detect module context from model namespace
        $className = get_class($this);
        $module = 'system';
        
        if (str_contains($className, 'App\\Models\\')) {
            $parts = explode('\\', $className);
            if (count($parts) > 3) {
                $module = strtolower($parts[2]);
            }
        }
        
        // Normalize business modules and system fallbacks
        $businessMapping = [
            'stock'           => 'inventory',
            'procurement'     => 'inventory',
            'inventory'       => 'inventory',
            'hr'              => 'hr',
            'leave'           => 'hr',
            'attendance'      => 'attendance',
            'sales'           => 'sales',
            'customers'       => 'crm',
            'crm'             => 'crm',
            'finance'         => 'finance',
            'workshop'        => 'workshop',
            'qualitycontrol'  => 'workshop',
            'report'          => 'reports',
            'reports'         => 'reports',
        ];

        if (isset($businessMapping[$module])) {
            $module = $businessMapping[$module];
        }

        // Fallback to request path if model is at root or doesn't match a specific module
        if ($module === 'models' || $module === 'system') {
            $segment = Request::segment(2);
            
            if ($segment && isset($businessMapping[$segment])) {
                $module = $businessMapping[$segment];
            } else {
                // Group low-level system tasks
                $systemSegments = ['media', 'access-control', 'notifications', 'push-subscriptions', 'broadcasting', 'telescope', 'backups', 'logs', 'system-logs'];
                if ($segment && in_array($segment, $systemSegments)) {
                    $module = 'system';
                } else {
                    $module = $segment ?: 'system';
                }
            }
        }

        $properties['module'] = $module;

        // Filter out non-serializable objects (like UploadedFile)
        $filteredProperties = $this->filterQueuableProperties($properties);

        $dispatchData = [
            'log_name'     => 'default',
            'description'  => "{$event} {$this->getSystemActivitySubjectDescription()}",
            'subject_type' => get_class($this),
            'subject_id'   => (string) $this->getKey(),
            'event'        => $event,
            'causer_type'  => $causer ? get_class($causer) : null,
            'causer_id'    => $causer ? (string) $causer->getKey() : null,
            'properties'   => $filteredProperties,
        ];

        // FINAL GUARD: Attempt to serialize. If it fails, strip ALL objects from properties.
        try {
            serialize($dispatchData);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Serialization failed for " . get_class($this) . " [{$event}]. Stripping all objects from properties.");
            $dispatchData['properties'] = $this->stripAllObjects($dispatchData['properties']);
        }

        ProcessSystemActivityLog::dispatch($dispatchData);
    }

    /**
     * Recursively filter out non-serializable objects like UploadedFile.
     * Uses a depth limit to prevent stack overflows on large models.
     */
    private function filterQueuableProperties(array $array, int $depth = 0): array
    {
        if ($depth > 5) return ['[DEPTH_LIMIT_REACHED]'];

        $result = [];
        foreach ($array as $key => $value) {
            if (is_array($value)) {
                $result[$key] = $this->filterQueuableProperties($value, $depth + 1);
            } elseif (is_object($value)) {
                if ($value instanceof \Illuminate\Http\UploadedFile) {
                    $result[$key] = $value->getClientOriginalName() . ' (File Uploaded)';
                } elseif (method_exists($value, '__toString')) {
                    $result[$key] = (string) $value;
                } else {
                    $result[$key] = get_class($value) . ' [STRIPPED]';
                }
            } else {
                $result[$key] = $value;
            }
        }
        return $result;
    }

    /**
     * Emergency fallback: recursively strip all objects from an array.
     */
    private function stripAllObjects(array $array, int $depth = 0): array
    {
        if ($depth > 5) return ['[DEPTH_LIMIT_REACHED]'];

        $result = [];
        foreach ($array as $key => $value) {
            if (is_array($value)) {
                $result[$key] = $this->stripAllObjects($value, $depth + 1);
            } else {
                $result[$key] = is_object($value) ? (get_class($value) . ' [STRIPPED]') : $value;
            }
        }
        return $result;
    }

    /**
     * Get a descriptive name for the model (e.g. Customer, Order #123)
     */
    protected function getSystemActivitySubjectDescription(): string
    {
        $className = class_basename($this);
        return strtolower($className);
    }
}
