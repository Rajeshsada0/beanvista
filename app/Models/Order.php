<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use BelongsToTenant, \App\Traits\BelongsToBranch;
    
    protected static function booted()
    {
        $clearCache = function ($tenantId) {
            if ($tenantId) {
                cache()->forget('active_orders_count_' . $tenantId);
                cache()->forget('cancelled_orders_count_' . $tenantId);
                cache()->forget('completed_today_count_' . $tenantId);
                cache()->forget('kds_items_count_' . $tenantId);
                cache()->forget('service_ready_count_' . $tenantId);
            }
        };

        static::saving(function ($order) {
            // Calculate Global Tax if total_amount is set
            if (isset($order->total_amount)) {
                $activeTaxes = \App\Models\Tax::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
                    ->where('tenant_id', $order->tenant_id)
                    ->where('status', true)
                    ->get();
                $totalTaxRate = $activeTaxes->sum('rate');
                
                $taxableAmount = $order->total_amount - ($order->discount_amount ?? 0) - ($order->points_redeemed ?? 0);
                $order->tax_amount = ($taxableAmount * $totalTaxRate) / 100;
                $order->grand_total = $taxableAmount + $order->tax_amount + ($order->tip_amount ?? 0);
            }
        });

        static::creating(function ($order) {
            // Generate a readable tenant order number if not set
            if (empty($order->order_number)) {
                $order->order_number = self::generateOrderNumber($order->tenant_id);
            }

            // Auto-assign branch_id from table or tenant fallback if missing
            if (empty($order->branch_id)) {
                if ($order->table_id) {
                    $table = \App\Models\Table::withoutGlobalScopes()->find($order->table_id);
                    if ($table && $table->branch_id) {
                        $order->branch_id = $table->branch_id;
                    }
                }
                if (empty($order->branch_id) && $order->tenant_id) {
                    $order->branch_id = \App\Models\Branch::where('tenant_id', $order->tenant_id)->value('id');
                }
            }
        });
        
        static::created(function ($order) use ($clearCache) {
            // Invalidate cached counts
            $clearCache($order->tenant_id);

            // When an order is created, sync the table status
            if ($order->table_id) {
                \App\Models\Table::syncStatus($order->table_id);
            }
        });

        static::updated(function ($order) use ($clearCache) {
            // Invalidate cached counts
            $clearCache($order->tenant_id);

            // If the order status changes, sync the table status
            if ($order->isDirty('status') || $order->isDirty('table_id')) {
                if ($order->table_id) {
                    \App\Models\Table::syncStatus($order->table_id);
                }
                
                // If the table_id changed, the old table should be checked/freed
                if ($order->isDirty('table_id')) {
                    $oldTableId = $order->getOriginal('table_id');
                    if ($oldTableId) {
                        \App\Models\Table::syncStatus($oldTableId);
                    }
                }
            }
        });

        static::deleted(function ($order) use ($clearCache) {
            $clearCache($order->tenant_id);
            if ($order->table_id) {
                \App\Models\Table::syncStatus($order->table_id);
            }
        });
    }

    protected $appends = ['display_number'];

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'order_number',
        'table_id', 
        'customer_id',
        'waiter_id',
        'status', 
        'total_amount',
        'discount_percentage',
        'discount_amount',
        'points_redeemed',
        'tip_amount', 
        'tax_amount',
        'grand_total', 
        'points_earned',
        'cash_amount', 
        'online_amount',
        'credit_amount',
        'due_payment_amount',
        'payment_method',
        'bank_account_id',
        'notes',
        'order_type',
        'car_plate',
        'car_description',
        'guest_count',
        'scheduled_at'
    ];
    
    protected static function generateOrderNumber($tenantId = null)
    {
        $tenantId = $tenantId ?: (auth()->check() ? auth()->user()->tenant_id : null);
        $query = self::withoutGlobalScopes();
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }
        
        $tenantCount = $query->count();
        $sequence = $tenantCount + 1;
        $orderNumber = "#" . $sequence;
        
        while ((clone $query)->where('order_number', $orderNumber)->exists()) {
            $sequence++;
            $orderNumber = "#" . $sequence;
        }
        
        return $orderNumber;
    }

    public function getDisplayNumberAttribute()
    {
        if (!empty($this->order_number) && $this->order_number !== (string)$this->id) {
            return str_starts_with($this->order_number, '#') ? $this->order_number : '#' . $this->order_number;
        }

        // Calculate tenant-scoped sequence index for existing orders where order_number was raw id or empty
        $tenantId = $this->tenant_id ?: (auth()->check() ? auth()->user()->tenant_id : null);
        if ($tenantId) {
            $seq = self::where('tenant_id', $tenantId)->where('id', '<=', $this->id)->count();
            return '#' . max(1, $seq);
        }

        return '#' . $this->id;
    }

    public function bankAccount()
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function table()
    {
        return $this->belongsTo(Table::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function waiter()
    {
        return $this->belongsTo(User::class, 'waiter_id');
    }
}
