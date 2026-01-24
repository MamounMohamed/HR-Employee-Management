<?php

namespace App\Repositories;

use App\Models\WorkLog;
use App\Models\WorkLogsReport;
use Carbon\Carbon;
use App\DTOs\WorkLogReportDTO;
use Illuminate\Pagination\LengthAwarePaginator;
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
    public function updateOrCreateDailyReport(int $userId, Carbon $date, int $totalMinutes): WorkLogsReport
    {
        return WorkLogsReport::updateOrCreate(
            [
                'user_id' => $userId,
                'work_date' => $date->toDateString(),
            ],
            [
                'time_worked_minutes' => $totalMinutes,
            ]
        );
    }

    public function getWorkLogsReports(WorkLogReportDTO $dto): LengthAwarePaginator
    {
        return WorkLogsReport::where('user_id', $dto->userId)
            ->whereBetween('work_date', [$dto->startDate->toDateString(), $dto->endDate->toDateString()])
            ->orderBy('work_date')
            ->paginate($dto->perPage, ['*'], 'page', $dto->page);
    }
}
