<?php

namespace App\Services;

use App\DTOs\WorkLogReportDTO;
use App\Models\WorkLogsReport;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Repositories\WorkLogReportRepository;
use App\Repositories\WorkLogRepository;
use Illuminate\Support\Collection;
use App\DTOs\WorkLogReportDayDetailsDTO;
use App\Enums\WorkLogStatusEnum;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class WorkLogReportService
{
    public function __construct(private WorkLogReportRepository $workLogReportRepository, private WorkLogRepository $workLogsRepository) {}

    public function getWorkLogsReports(WorkLogReportDTO $dto): LengthAwarePaginator
    {
        return $this->workLogReportRepository->getWorkLogsReports($dto);
    }

    public function updateOrCreateTodayNotes(int $userId, ?string $notes): WorkLogsReport
    {
        return $this->workLogReportRepository->updateNotes($userId, $notes ?? '');
    }
    public function getDayDetails(WorkLogReportDayDetailsDTO $dto): array
    {
        $logs = $this->workLogsRepository->getWorkLogs($dto->userId, $dto->workDate);

        if ($logs->isEmpty()) {
            return [
                'start' => null,
                'end' => null,
                'breaks' => [],
                'worked_duration_minutes' => 0,
            ];
        }

        return $this->handleLogs($logs);
    }

    private function handleLogs(Collection $logs): array
    {
        // Sort by created_at
        $logs = $logs->sortBy('created_at')->values();

        $start = null;
        $end = null;
        $breaks = [];
        $lastStop = null;
        $workedMinutes = 0;

        foreach ($logs as $log) {
            $time = Carbon::parse($log->created_at);

            if ($log->status === WorkLogStatusEnum::RUNNING) {
                if (!$start) {
                    $start = $time;
                }
                if ($lastStop) {
                    // There was a break
                    $breaks[] = [
                        'from' => $lastStop,
                        'to' => $time,
                        'duration_minutes' => $time->diffInMinutes($lastStop),
                    ];
                    $lastStop = null;
                }
            }

            if ($log->status === WorkLogStatusEnum::STOPPED) {
                $end = $time;
                if ($start) {
                    $workedMinutes += $time->diffInMinutes($start) - array_sum(array_column($breaks, 'duration_minutes'));
                }
                $lastStop = $time;
                $start = null; // reset for next running period
            }
        }

        return [
            'start' => $logs->firstWhere('status', 'running')?->created_at,
            'end' => $logs->reverse()->firstWhere('status', 'stopped')?->created_at,
            'breaks' => $breaks,
            'worked_duration_minutes' => $workedMinutes,
        ];
    }
}
