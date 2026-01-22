<?php

namespace App\Repositories;

use App\Models\WorkLog;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class WorkLogRepository
{
    public function create(int $userId, string $status): WorkLog
    {
        return WorkLog::create([
            'user_id' => $userId,
            'status' => $status,
        ]);
    }

    public function getLogsForDateRange(int $userId, Carbon $start, Carbon $end): Collection
    {
        return WorkLog::where('user_id', $userId)
            ->whereBetween('created_at', [$start, $end])
            ->orderBy('created_at')
            ->get();
    }
}
