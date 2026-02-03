<?php

namespace App\Services;

use App\DTOs\WorkLogReportDTO;
use App\Models\WorkLogsReport;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Repositories\WorkLogReportRepository;
use App\Repositories\WorkLogRepository;
use Illuminate\Support\Collection;
use App\DTOs\WorkLogDayDetailsDTO;
use App\Enums\WorkLogStatusEnum;
use Carbon\Carbon;


class WorkLogReportService
{
    public function __construct(private WorkLogReportRepository $workLogReportRepository, private WorkLogRepository $workLogsRepository)
    {
    }

    public function getWorkLogsReports(WorkLogReportDTO $dto): LengthAwarePaginator
    {
        return $this->workLogReportRepository->getWorkLogsReports($dto);
    }

    public function updateOrCreateTodayNotes(int $userId, ?string $notes): WorkLogsReport
    {
        return $this->workLogReportRepository->updateNotes($userId, $notes ?? '');
    }
    public function getDayDetails(int $userId, Carbon $workDate): WorkLogDayDetailsDTO
    {
        $logs = $this->workLogsRepository->getWorkLogs($userId, $workDate);
        return $this->calculateDayDetails($logs);
    }
    private function calculateDayDetails(Collection $logs): WorkLogDayDetailsDTO
    {
        if ($logs->isEmpty()) {
            return WorkLogDayDetailsDTO::empty();
        }

        $sortedLogs = $logs->sortBy('created_at')->values();

        $dayStart = null;
        $dayEnd = null;
        $breaks = [];
        $lastStoppedAt = null;

        foreach ($sortedLogs as $log) {
            $time = Carbon::parse($log->created_at);

            if ($log->status === WorkLogStatusEnum::RUNNING) {
                $dayStart ??= $time;

                if ($lastStoppedAt) {
                    $breaks[] = [
                        'from' => $lastStoppedAt,
                        'to' => $time,
                    ];
                    $lastStoppedAt = null;
                }
            }

            if ($log->status === WorkLogStatusEnum::STOPPED) {
                $dayEnd = $time;
                $lastStoppedAt = $time;
            }
        }

        return new WorkLogDayDetailsDTO($dayStart, $dayEnd, $breaks);
    }
}
