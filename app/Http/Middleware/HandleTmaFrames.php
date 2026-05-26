<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleTmaFrames
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // For the mockup to work in the CRM dashboard, we must allow SAMEORIGIN.
        // For the actual Mini App to work in Telegram, we often need to remove it
        // or use frame-ancestors in CSP.
        
        // Explicitly set to SAMEORIGIN instead of DENY for traditional frame support
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Modern browsers check CSP frame-ancestors. 
        // For TMA, we must allow framing from Telegram's domains.
        // Safest is to allow * here, or specialized lists if needed.
        $response->headers->set('Content-Security-Policy', "frame-ancestors *;");

        return $response;
    }
}
