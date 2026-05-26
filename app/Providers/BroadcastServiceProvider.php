<?php

namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;

class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Default routes for Admin/Web (uses 'web' middleware by default)
        Broadcast::routes();

        // Custom routes for TMA/PWA (uses 'api' and custom token-based auth)
        Broadcast::routes(['prefix' => 'api', 'middleware' => ['api', 'auth.employee']]);

        require base_path('routes/channels.php');
    }
}
