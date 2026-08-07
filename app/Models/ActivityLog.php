<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ActivityLog extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'action',
        'subject_type',
        'subject_id',
        'description',
        'properties'
    ];

    protected $casts = [
        'properties' => 'array',
    ];

    protected $appends = ['formatted_time', 'time_ago', 'icon_type'];

    /**
     * Relationship to the user who performed the action.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the subject model.
     */
    public function subject()
    {
        return $this->morphTo();
    }

    public function getFormattedTimeAttribute()
    {
        return $this->created_at->format('h:i A');
    }

    public function getTimeAgoAttribute()
    {
        return $this->created_at->diffForHumans();
    }

    public function getIconTypeAttribute()
    {
        if (!$this->subject_type) return 'info';
        
        $type = strtolower($this->subject_type);
        if (str_contains($type, 'order')) return 'order';
        if (str_contains($type, 'menu')) return 'menu';
        if (str_contains($type, 'shift')) return 'staff';
        if (str_contains($type, 'reservation')) return 'reservation';
        if (str_contains($type, 'customer')) return 'customer';
        return 'info';
    }

    /**
     * Helper to record activity.
     */
    public static function record($action, $description, $subject = null, $properties = [])
    {
        return self::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'description' => $description,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject ? $subject->id : null,
            'properties' => $properties,
        ]);
    }
}
