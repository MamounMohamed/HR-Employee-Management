<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Enums\WorkLogStatusEnum;

class WorkLog extends Model
{
    protected $fillable = [
        'user_id',
        'status',
    ];

    protected $casts = [
        'status' => WorkLogStatusEnum::class,
    ];
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
