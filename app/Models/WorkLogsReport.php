<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkLogsReport extends Model
{
    protected $fillable = [
        'user_id',
        'work_date',
        'time_worked_minutes',
        'notes',
    ];

    protected $casts = [
        'work_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
