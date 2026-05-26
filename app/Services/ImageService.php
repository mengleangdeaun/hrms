<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageService
{
    /**
     * Compress and convert image to WebP format.
     *
     * @param UploadedFile $file
     * @param string $directory
     * @param int $quality
     * @return string|false Path to the stored image or false on failure
     */
    public function compressToWebp(UploadedFile $file, string $directory = 'products', int $quality = 80)
    {
        $mimeType = $file->getMimeType();
        $filename = Str::random(40) . '.webp';
        $path = $directory . '/' . $filename;

        // Create image resource based on MIME type
        switch ($mimeType) {
            case 'image/jpeg':
            case 'image/jpg':
                $image = @imagecreatefromjpeg($file->getRealPath());
                break;
            case 'image/png':
                $image = @imagecreatefrompng($file->getRealPath());
                // Preserve transparency for PNG
                if ($image) {
                    imagepalettetotruecolor($image);
                    imagealphablending($image, true);
                    imagesavealpha($image, true);
                }
                break;
            case 'image/gif':
                $image = @imagecreatefromgif($file->getRealPath());
                break;
            case 'image/webp':
                $image = @imagecreatefromwebp($file->getRealPath());
                break;
            default:
                return false;
        }

        if (!$image) {
            return false;
        }

        // Use a temporary file to save the webp image
        $tempFile = tempnam(sys_get_temp_dir(), 'webp');
        
        try {
            if (imagewebp($image, $tempFile, $quality)) {
                // Store the file using Laravel's Storage
                Storage::disk('public')->putFileAs($directory, new \Illuminate\Http\File($tempFile), $filename);
                imagedestroy($image);
                unlink($tempFile);
                return $path;
            }
        } catch (\Exception $e) {
            if (isset($image) && is_resource($image)) {
                imagedestroy($image);
            }
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
            throw $e;
        }

        return false;
    }
}
