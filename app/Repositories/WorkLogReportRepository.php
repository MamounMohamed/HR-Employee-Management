<?php

namespace App\Repositories;

use App\Models\WorkLogsReport;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use App\DTOs\WorkLogReportDTO;

class WorkLogReportRepository
{
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

    public function updateNotes(WorkLogsReport $workLogReport, string $notes): WorkLogsReport
    {
        $workLogReport->update(['notes' => $notes]);
        return $workLogReport;
    }

    public function getWorkLogsReports(WorkLogReportDTO $dto): LengthAwarePaginator
    {
        return WorkLogsReport::where('user_id', $dto->userId)
            ->whereBetween('work_date', [$dto->startDate->toDateString(), $dto->endDate->toDateString()])
            ->orderBy('work_date')
            ->paginate($dto->perPage, ['*'], 'page', $dto->page);
    }
}
