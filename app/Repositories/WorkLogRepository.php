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
    public function getWorkLogs(int $userId, $day = null): Collection
    {
        $day ??= Carbon::today();
        return WorkLog::where('user_id', $userId)
            ->whereDate('created_at', $day)
            ->orderBy('created_at')
            ->get();
    }
}
