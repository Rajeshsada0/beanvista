<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                    'primary_branch_id' => $request->user()->primary_branch_id,
                ] : null,
                'branches' => function () use ($request) {
                    $user = $request->user();
                    if (!$user) return [];
                    
                    if ($user->role === 'super_admin') {
                        return [];
                    }
                    
                    if ($user->role === 'admin') {
                        return \App\Models\Branch::where('tenant_id', $user->tenant_id)
                            ->where('is_active', true)
                            ->get(['id', 'name', 'code']);
                    }
                    
                    return $user->branches()
                        ->where('is_active', true)
                        ->get(['branches.id as id', 'branches.name as name', 'branches.code as code']);
                },
                'active_branch_id' => session('active_branch_id'),
                'plan_limits' => function () use ($request) {
                    $user = $request->user();
                    if (!$user || !$user->tenant_id || $user->role === 'super_admin') {
                        return null;
                    }
                    $tenant = $user->tenant;
                    if (!$tenant) {
                        return null;
                    }
                    return [
                        'max_branches' => [
                            'limit' => $tenant->getPlanLimit('max_branches'),
                            'usage' => $tenant->getCurrentUsage('max_branches'),
                            'reached' => $tenant->hasLimitReached('max_branches'),
                        ],
                        'max_tables' => [
                            'limit' => $tenant->getPlanLimit('max_tables'),
                            'usage' => $tenant->getCurrentUsage('max_tables'),
                            'reached' => $tenant->hasLimitReached('max_tables'),
                        ],
                        'max_accounts' => [
                            'limit' => $tenant->getPlanLimit('max_accounts'),
                            'usage' => $tenant->getCurrentUsage('max_accounts'),
                            'reached' => $tenant->hasLimitReached('max_accounts'),
                        ],
                        'max_users' => [
                            'limit' => $tenant->getPlanLimit('max_users'),
                            'usage' => $tenant->getCurrentUsage('max_users'),
                            'reached' => $tenant->hasLimitReached('max_users'),
                        ],
                        'max_orders_per_month' => [
                            'limit' => $tenant->getPlanLimit('max_orders_per_month'),
                            'usage' => $tenant->getCurrentUsage('max_orders_per_month'),
                            'reached' => $tenant->hasLimitReached('max_orders_per_month'),
                        ],
                        'subscription' => $tenant->getSubscriptionDetails(),
                    ];
                },
            ],
            'is_impersonating' => session()->has('original_user_id'),
            'trial' => function () use ($request) {
                $user = $request->user();
                if ($user && $user->tenant_id) {
                    $cacheKey = 'tenant_trial_' . $user->tenant_id;
                    return cache()->remember($cacheKey, 300, function() use ($user) {
                        $tenant = \App\Models\Tenant::with('subscription')->find($user->tenant_id);
                        if (!$tenant) return null;

                        // Active subscription takes precedence — trial is no longer active or expired
                        $sub = $tenant->subscription;
                        if ($sub && $sub->status === 'active' && !$sub->is_expired) {
                            return null;
                        }

                        if ($tenant->trial_ends_at) {
                            $now = \Carbon\Carbon::now();
                            $endsAt = \Carbon\Carbon::parse($tenant->trial_ends_at);
                            $isExpired = $now->greaterThan($endsAt);
                            
                            return [
                                'ends_at' => $endsAt->toIso8601String(),
                                'days_remaining' => $isExpired ? 0 : (int) ceil($now->floatDiffInDays($endsAt)),
                                'is_expired' => $isExpired,
                            ];
                        }
                        return null;
                    });
                }
                return null;
            },
            'settings' => function () use ($request) {
                $tenantId = null;
                $user = $request->user();
                
                if ($user && $user->tenant_id) {
                    $tenantId = $user->tenant_id;
                } else {
                    // Try to get tenant from slug in route (for guests)
                    $slug = $request->route('tenant_slug');
                    if ($slug) {
                        $tenantId = cache()->remember('tenant_id_' . $slug, 3600, function() use ($slug) {
                            return \App\Models\Tenant::where('slug', $slug)->value('id');
                        });
                    }
                }

                if (!$tenantId) {
                    return null;
                }

                $cacheKey = 'settings_tenant_' . $tenantId;
                return cache()->remember($cacheKey, 60, function() use ($tenantId) {
                    $settings = \App\Models\Setting::where('tenant_id', $tenantId)->pluck('value', 'key')->toArray();

                    // Resolve tenant's canonical cafe name as the default for site_name
                    $tenant = \App\Models\Tenant::find($tenantId);
                    $tenantName = $tenant?->name ?? 'My Cafe';

                    // If tenant hasn't explicitly set a site_name, fall back to their cafe name
                    if (empty($settings['site_name'])) {
                        $settings['site_name'] = $tenantName;
                    }

                    // Always expose tenant_name so JS can distinguish it from the custom site_name
                    $settings['tenant_name'] = $tenantName;

                    // Ensure image paths are absolute URLs
                    if (isset($settings['site_logo']) && $settings['site_logo']) {
                        $settings['site_logo'] = \Illuminate\Support\Facades\Storage::disk('public')->url($settings['site_logo']);
                    }
                    if (isset($settings['site_favicon']) && $settings['site_favicon']) {
                        $settings['site_favicon'] = \Illuminate\Support\Facades\Storage::disk('public')->url($settings['site_favicon']);
                    }
                    return $settings;
                });
            },
            'tenant_slug' => function () use ($request) {
                $user = $request->user();
                if ($user && $user->tenant_id) {
                    return cache()->remember('tenant_slug_' . $user->tenant_id, 3600, function() use ($user) {
                        $tenant = \App\Models\Tenant::find($user->tenant_id);
                        return $tenant?->slug;
                    });
                }
                // Fallback to route parameter or session if available
                return $request->route('tenant_slug') ?? session('tenant_slug');
            },
            'active_orders_count' => function () use ($request) {
                $user = $request->user();
                if ($user && $user->tenant_id && $user->role !== 'super_admin') {
                    $cacheKey = 'active_orders_count_' . $user->tenant_id;
                    return cache()->remember($cacheKey, 5, function() use ($user) {
                        return \App\Models\Order::where('tenant_id', $user->tenant_id)
                            ->whereNotIn('status', ['completed', 'cancelled'])
                            ->count();
                    });
                }
                return 0;
            },
            'cancelled_orders_count' => function () use ($request) {
                $user = $request->user();
                if ($user && $user->tenant_id && $user->role !== 'super_admin') {
                    $cacheKey = 'cancelled_orders_count_' . $user->tenant_id;
                    return cache()->remember($cacheKey, 5, function() use ($user) {
                        return \App\Models\Order::where('tenant_id', $user->tenant_id)
                            ->where('status', 'cancelled')
                            ->count();
                    });
                }
                return 0;
            },
            'completed_today_count' => function () use ($request) {
                $user = $request->user();
                if ($user && $user->tenant_id && $user->role !== 'super_admin') {
                    $cacheKey = 'completed_today_count_' . $user->tenant_id;
                    return cache()->remember($cacheKey, 5, function() use ($user) {
                        return \App\Models\Order::where('tenant_id', $user->tenant_id)
                            ->where('status', 'completed')
                            ->whereDate('created_at', \Carbon\Carbon::today())
                            ->count();
                    });
                }
                return 0;
            },
            'kds_items_count' => function () use ($request) {
                $user = $request->user();
                if ($user && $user->tenant_id && $user->role !== 'super_admin') {
                    $cacheKey = 'kds_items_count_' . $user->tenant_id;
                    return cache()->remember($cacheKey, 5, function() use ($user) {
                        return \App\Models\OrderItem::whereIn('kds_status', ['pending', 'preparing'])
                            ->whereHas('order', function ($q) use ($user) {
                                $q->where('tenant_id', $user->tenant_id)
                                  ->whereNotIn('status', ['completed', 'cancelled']);
                            })->count();
                    });
                }
                return 0;
            },
            'service_ready_count' => function () use ($request) {
                $user = $request->user();
                if ($user && $user->tenant_id && $user->role !== 'super_admin') {
                    $cacheKey = 'service_ready_count_' . $user->tenant_id;
                    return cache()->remember($cacheKey, 5, function() use ($user) {
                        return \App\Models\OrderItem::where('kds_status', 'ready')
                            ->whereHas('order', function ($q) use ($user) {
                                $q->where('tenant_id', $user->tenant_id)
                                  ->whereNotIn('status', ['completed', 'cancelled']);
                            })->count();
                    });
                }
                return 0;
            },
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ];
    }
}
