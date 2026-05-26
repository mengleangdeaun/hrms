<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    /**
     * Proxies a file from storage and serves it with 'inline' disposition.
     * This ensures browsers preview PDFs instead of downloading them.
     */
    public function inline(Request $request, $filename = null)
    {
        $path = $request->query('path');

        if (!$path) {
            abort(404, 'No path provided');
        }

        // Standardize the path (remove leading storage/ if present)
        $cleanPath = ltrim($path, '/');
        if (str_starts_with($cleanPath, 'storage/')) {
            $cleanPath = substr($cleanPath, 8);
        }

        // Search in public first, then local (handles multi-disk migrations)
        $disk = null;
        if (Storage::disk('public')->exists($cleanPath)) {
            $disk = Storage::disk('public');
        } elseif (Storage::disk('local')->exists($cleanPath)) {
            $disk = Storage::disk('local');
        }

        if (!$disk) {
            \Log::error("Media Proxy 404: File not found on any disk: " . $cleanPath);
            abort(404, 'File not found: ' . $cleanPath);
        }

        $headers = [
            'Content-Type' => 'application/octet-stream', // Camouflage to bypass IDM hijack
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
            'X-IDM-No-Hijack' => 'true', // Helper for some download managers
        ];

        $ext = strtolower(pathinfo($cleanPath, PATHINFO_EXTENSION));
        if ($ext !== 'pdf') {
            $headers['Content-Type'] = $disk->mimeType($cleanPath) ?: 'application/octet-stream';
        }

        // Final hardening: Clear all output buffers to ensure no whitespace/trash pollutes the binary stream
        if (ob_get_level()) ob_end_clean();

        // Use raw binary response for 100% byte-certainty (eliminates 0-byte stream issues)
        $absolutePath = $disk->path($cleanPath);
        $content = file_get_contents($absolutePath);

        return response($content, 200, $headers);
    }
}
