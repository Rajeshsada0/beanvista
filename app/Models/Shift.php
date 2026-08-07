<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use BelongsToTenant, \App\Traits\BelongsToBranch;

    protected $fillable = ['user_id', 'clock_in_at', 'clock_out_at'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
