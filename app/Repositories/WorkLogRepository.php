<?php

namespace App\Repositories;

use App\Models\WorkLog;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

class WorkLogRepository
{
    public function create(int $userId, string $status): WorkLog
    {
        return WorkLog::create([
            'user_id' => $userId,
            'status' => $status,
        ]);
    }
    public function getWorkLogs(int $userId, Carbon $today): Collection
    {
        return WorkLog::where('user_id', $userId)
            ->whereDate('created_at', $today)
            ->orderBy('created_at')
            ->get();
    }
}
