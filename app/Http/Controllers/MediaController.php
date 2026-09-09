<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use App\Models\Menu;
use App\Models\LoyaltyReward;

use App\Traits\CompressesImages;

class MediaController extends Controller
{
    use CompressesImages;
    /**
     * Get all images from the menus directory.
     */
    public function index(Request $request)
    {
        $type = $request->input('type', 'images'); // 'images' or 'icons'
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        $tenantId = $user->tenant_id;
        $directories = ["tenants/{$tenantId}/menus/{$type}"];
        if ($type === 'images') {
            $directories[] = "tenants/{$tenantId}/banners";
        }

        $files = [];
        foreach ($directories as $directory) {
            if (Storage::disk('public')->exists($directory)) {
                $files = array_merge($files, Storage::disk('public')->files($directory));
            }
        }

        if (empty($files)) {
            return response()->json([]);
        }
        
        $media = collect($files)->map(function ($file) {
            return [
                'name' => basename($file),
                'path' => $file,
                'url' => url('/img/' . $file),
                'size' => Storage::disk('public')->size($file),
                'last_modified' => Storage::disk('public')->lastModified($file),
            ];
        })->sortByDesc('last_modified')->values();

        return response()->json($media);
    }

    /**
     * Upload an image/icon to the media directory.
     */
    public function upload(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|image|max:10240', // max 10MB
                'type' => 'nullable|string|in:images,icons',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error: ' . implode(', ', \Illuminate\Support\Arr::flatten($e->errors())),
                'errors' => $e->errors()
            ], 422);
        }

        $type = $request->input('type', 'images');
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        $tenantId = $user->tenant_id;
        $directory = "tenants/{$tenantId}/menus/{$type}";

        if (!Storage::disk('public')->exists($directory)) {
            Storage::disk('public')->makeDirectory($directory);
        }

        $file = $request->file('file');
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        
        $path = $this->compressAndSaveImage($file, $directory, $originalName);
        $safeName = basename($path);

        return response()->json([
            'success' => true,
            'media' => [
                'name' => $safeName,
                'path' => $path,
                'url' => url('/img/' . $path),
                'size' => Storage::disk('public')->size($path),
                'last_modified' => Storage::disk('public')->lastModified($path),
            ]
        ]);
    }

    /**
     * Rename a media asset.
     */
    public function rename(Request $request)
    {
        try {
            $request->validate([
                'path' => 'required|string',
                'new_name' => 'required|string',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        }

        $path = $request->input('path');
        $newName = $request->input('new_name');
        
        // Security check: ensure path belongs to user's tenant
        $tenantId = auth()->user()->tenant_id;
        if (!str_starts_with($path, "tenants/{$tenantId}/")) {
            return response()->json(['message' => 'Unauthorized path'], 403);
        }

        if (!Storage::disk('public')->exists($path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        $directory = dirname($path);
        $extension = pathinfo($path, PATHINFO_EXTENSION);
        // Clean name
        $newBaseName = Str::slug(pathinfo($newName, PATHINFO_FILENAME));
        $newPath = $directory . '/' . $newBaseName . '.' . $extension;

        if (Storage::disk('public')->exists($newPath)) {
            return response()->json(['message' => 'A file with this name already exists'], 422);
        }

        Storage::disk('public')->move($path, $newPath);

        // Update database references in menus, loyalty rewards and banners
        Menu::where('image_path', $path)->update(['image_path' => $newPath]);
        Menu::where('icon_path', $path)->update(['icon_path' => $newPath]);
        LoyaltyReward::where('image_path', $path)->update(['image_path' => $newPath]);
        \App\Models\Banner::where('image_path', $path)->update(['image_path' => $newPath]);

        return response()->json([
            'success' => true,
            'media' => [
                'name' => basename($newPath),
                'path' => $newPath,
                'url' => url('/img/' . $newPath),
                'size' => Storage::disk('public')->size($newPath),
                'last_modified' => Storage::disk('public')->lastModified($newPath),
            ]
        ]);
    }

    /**
     * Delete a media asset.
     */
    public function delete(Request $request)
    {
        try {
            $request->validate([
                'path' => 'required|string',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        }

        $path = $request->input('path');
        
        // Security check: ensure path belongs to user's tenant
        $tenantId = auth()->user()->tenant_id;
        if (!str_starts_with($path, "tenants/{$tenantId}/")) {
            return response()->json(['message' => 'Unauthorized path'], 403);
        }

        if (!Storage::disk('public')->exists($path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        Storage::disk('public')->delete($path);

        // Clear database references in menus, loyalty rewards and banners
        Menu::where('image_path', $path)->update(['image_path' => null]);
        Menu::where('icon_path', $path)->update(['icon_path' => null]);
        LoyaltyReward::where('image_path', $path)->update(['image_path' => null]);
        \App\Models\Banner::where('image_path', $path)->update(['image_path' => null]);

        return response()->json([
            'success' => true,
            'message' => 'File deleted successfully'
        ]);
    }
}
