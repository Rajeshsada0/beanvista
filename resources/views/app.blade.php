<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        @php
            $settings = [];
            $tenantId = null;
            if (auth()->check()) {
                $tenantId = auth()->user()->tenant_id;
            } else {
                $route = request()->route();
                if ($route && $route->hasParameter('tenant_slug')) {
                    $slug = $route->parameter('tenant_slug');
                    $tenantId = cache()->remember('tenant_id_' . $slug, 3600, function() use ($slug) {
                        return \App\Models\Tenant::where('slug', $slug)->value('id');
                    });
                }
            }

            if ($tenantId) {
                $cacheKey = 'settings_tenant_' . $tenantId;
                $settings = cache()->remember($cacheKey, 60, function() use ($tenantId) {
                    $data = \App\Models\Setting::where('tenant_id', $tenantId)->pluck('value', 'key');
                    if (isset($data['site_logo']) && $data['site_logo']) { $data['site_logo'] = asset('storage/' . $data['site_logo']); }
                    if (isset($data['site_favicon']) && $data['site_favicon']) { $data['site_favicon'] = asset('storage/' . $data['site_favicon']); }
                    return $data;
                });
            }

            $globalFavicon = cache()->remember('global_favicon', 60, function() {
                $val = \App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'site_favicon')->value('value');
                return $val ? \Illuminate\Support\Facades\Storage::disk('public')->url($val) : null;
            });
            
            $siteName = $settings['site_name'] ?? config('app.name', 'Cafe management system');
            $favicon = $globalFavicon; // Always use the global Super Admin favicon
        @endphp
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ $siteName }}</title>

        @if($favicon)
            <link rel="icon" type="image/x-icon" href="{{ $favicon }}">
        @endif

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com">
        <link rel="dns-prefetch" href="https://fonts.gstatic.com">
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
        <noscript>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        </noscript>

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
