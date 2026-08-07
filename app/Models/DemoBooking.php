<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DemoBooking extends Model
{
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'cafe_name',
        'status',
    ];
}
