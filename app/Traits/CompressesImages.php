<?php

namespace App\Traits;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait CompressesImages
{
    /**
     * Compress an uploaded image to under 100KB and save it to the public disk.
     *
     * Uses PHP output buffering (no temp files) for maximum server compatibility.
     *
     * @param  \Illuminate\Http\UploadedFile  $file
     * @param  string  $directory  Relative path e.g. 'tenants/1/menus/images'
     * @param  string|null  $fileNameWithoutExt  Optional custom filename (no extension)
     * @return string  The stored path relative to the public disk root
     */
    public function compressAndSaveImage($file, $directory, $fileNameWithoutExt = null)
    {
        $originalName    = $fileNameWithoutExt ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeName        = Str::slug($originalName) . '_' . time() . '.jpg';
        $targetPath      = $directory . '/' . $safeName;
        $fallbackExt     = $file->getClientOriginalExtension() ?: 'jpg';
        $fallbackName    = Str::slug($originalName) . '_' . time() . '.' . $fallbackExt;
        $fallbackPath    = $directory . '/' . $fallbackName;
        $rawContent      = file_get_contents($file->getRealPath());

        // Ensure directory exists on the public disk
        if (!Storage::disk('public')->exists($directory)) {
            Storage::disk('public')->makeDirectory($directory);
        }

        // ── GD check ──────────────────────────────────────────────────────────
        // If GD is unavailable, save original file as-is and return early.
        if (!extension_loaded('gd') || !function_exists('imagecreatefromjpeg')) {
            Storage::disk('public')->put($fallbackPath, $rawContent);
            if (Storage::disk('public')->exists($fallbackPath) &&
                Storage::disk('public')->size($fallbackPath) > 0) {
                return $fallbackPath;
            }
            // Hard fallback — copy via move_uploaded_file if storage put failed
            $absPath = storage_path('app/public/' . $fallbackPath);
            @mkdir(dirname($absPath), 0775, true);
            file_put_contents($absPath, $rawContent);
            return $fallbackPath;
        }

        // ── Load image resource ───────────────────────────────────────────────
        $info = @getimagesize($file->getRealPath());

        if (!$info) {
            return $this->_saveRaw($rawContent, $fallbackPath);
        }

        $mime   = $info['mime'];
        $srcW   = $info[0];
        $srcH   = $info[1];

        switch ($mime) {
            case 'image/jpeg':
            case 'image/jpg':
                $image = @imagecreatefromjpeg($file->getRealPath());
                break;
            case 'image/png':
                $image = @imagecreatefrompng($file->getRealPath());
                break;
            case 'image/gif':
                $image = @imagecreatefromgif($file->getRealPath());
                break;
            case 'image/webp':
                $image = function_exists('imagecreatefromwebp')
                    ? @imagecreatefromwebp($file->getRealPath())
                    : false;
                break;
            default:
                $image = false;
        }

        if (!$image) {
            return $this->_saveRaw($rawContent, $fallbackPath);
        }

        // ── Flatten transparency (PNG/GIF → JPEG) ─────────────────────────────
        $flat  = imagecreatetruecolor(imagesx($image), imagesy($image));
        $white = imagecolorallocate($flat, 255, 255, 255);
        imagefill($flat, 0, 0, $white);
        imagecopy($flat, $image, 0, 0, 0, 0, imagesx($image), imagesy($image));
        imagedestroy($image);
        $image = $flat;

        // ── PHASE 1: Cap dimension at 1200px ─────────────────────────────────
        $maxDim = 1200;
        if ($srcW > $maxDim || $srcH > $maxDim) {
            $ratio  = $srcW / $srcH;
            $newW   = $ratio > 1 ? $maxDim : (int) round($maxDim * $ratio);
            $newH   = $ratio > 1 ? (int) round($maxDim / $ratio) : $maxDim;
            $scaled = imagescale($image, $newW, $newH);
            if ($scaled) {
                imagedestroy($image);
                $image = $scaled;
            }
        }

        // ── PHASE 2: Quality loop (85 → 10, step -5) ─────────────────────────
        $maxBytes = 100 * 1024; // 100 KB hard limit
        $quality  = 85;

        $imageData = $this->_captureJpeg($image, $quality);

        while (strlen($imageData) > $maxBytes && $quality > 10) {
            $quality  -= 5;
            $imageData = $this->_captureJpeg($image, $quality);
        }

        // ── PHASE 3: Dimension shrink loop (20% per step) ────────────────────
        while (strlen($imageData) > $maxBytes) {
            $curW = imagesx($image);
            $curH = imagesy($image);
            if ($curW <= 100 || $curH <= 100) {
                break;
            }
            $scaled = imagescale($image, (int) round($curW * 0.8), (int) round($curH * 0.8));
            if (!$scaled) {
                break;
            }
            imagedestroy($image);
            $image     = $scaled;
            $imageData = $this->_captureJpeg($image, $quality);
        }

        imagedestroy($image);

        // ── Guard: if imageData is empty, fall back to raw original ──────────
        if (empty($imageData)) {
            return $this->_saveRaw($rawContent, $fallbackPath);
        }

        // ── Write to public disk ──────────────────────────────────────────────
        Storage::disk('public')->put($targetPath, $imageData);

        // Verify the file actually landed on disk with content
        if (!Storage::disk('public')->exists($targetPath) ||
            Storage::disk('public')->size($targetPath) === 0) {
            // Hard fallback using absolute path
            $absPath = storage_path('app/public/' . $targetPath);
            @mkdir(dirname($absPath), 0775, true);
            file_put_contents($absPath, $imageData ?: $rawContent);
        }

        return $targetPath;
    }

    /**
     * Capture JPEG image data into a string using output buffering (no temp files).
     */
    private function _captureJpeg($image, int $quality): string
    {
        ob_start();
        imagejpeg($image, null, $quality);
        return (string) ob_get_clean();
    }

    /**
     * Save raw file content as a fallback (preserves original format).
     */
    private function _saveRaw(string $rawContent, string $path): string
    {
        Storage::disk('public')->put($path, $rawContent);

        if (!Storage::disk('public')->exists($path) ||
            Storage::disk('public')->size($path) === 0) {
            $absPath = storage_path('app/public/' . $path);
            @mkdir(dirname($absPath), 0775, true);
            file_put_contents($absPath, $rawContent);
        }

        return $path;
    }
}
