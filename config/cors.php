<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

 'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Explicitly allow your frontend URL from your .env file
    'allowed_origins' => [
        env('APP_URL', 'http://localhost:3000'), 
        'https://sccg-main-hgzcux.free.laravel.cloud',
        'https://la3la3.site'
    ],

    'allowed_origins_patterns' => [], // Clear this out to prevent conflicts

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
