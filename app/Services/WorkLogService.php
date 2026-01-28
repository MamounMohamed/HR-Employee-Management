<?php

namespace App\Services;

use App\Models\WorkLog;
use App\Enums\WorkLogStatusEnum;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use App\Repositories\WorkLogRepository;
use App\Models\User;
use App\DTOs\WorkLogReportDTO;
use App\DTOs\WorkLogCalculationDTO;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Models\WorkLogsReport;
use App\Repositories\WorkLogReportRepository;

class WorkLogService
{
    public function __construct(
        private WorkLogRepository $workLogsRepository,
        private WorkLogReportRepository $workLogReportRepository
    ) {}

    public function storeLog(int $userId, WorkLogStatusEnum $status): WorkLog
    {
        $lastLog = User::findOrFail($userId)->latestWorkLog;

        if ($lastLog && $lastLog->status === $status->value) {
            throw new \Exception('Invalid action sequence');
        }

        $workLog = $this->workLogsRepository->create($userId, $status->value);

        return $workLog;
    }

    public function syncToDailyReport(int $userId, Carbon $date): WorkLogsReport
    {
        $workLogCalculationDto = $this->getWorkedMinutesTodayForCurrentUser();
        return $this->workLogReportRepository->updateOrCreateDailyReport($userId, $date, $workLogCalculationDto->totalMinutes);
    }

    public function getWorkedMinutesTodayForCurrentUser(): WorkLogCalculationDTO
    {
        return $this->sumMinutesFromStartStopPairs(Auth::id(), now()->today());
    }


    private function sumMinutesFromStartStopPairs(int $userId, Carbon $today): WorkLogCalculationDTO
    {
        $totalMinutes = 0;
        $logs = $this->workLogsRepository->getWorkLogs($userId, $today);

        $startLog = null;

        foreach ($logs as $log) {
            if ($log->status->isRunning()) {
                $startLog = $log;
            } elseif ($log->status->isStopped() && $startLog !== null) {
                $totalMinutes += $this->calculateSessionMinutes($startLog, $log);
                $startLog = null;
            }
        }
        return new WorkLogCalculationDTO($totalMinutes, $logs->last()?->status->value, $logs->last()?->created_at);
    }

    private function calculateSessionMinutes(WorkLog $startLog, WorkLog $endLog): int
    {
        return $startLog->created_at->diffInMinutes($endLog->created_at);
    }
    public function autoEndRunningSessions(): int
    {
        $users = User::with('latestWorkLog')->get();
        $runningUsers = $users->filter(fn($user) => $user->latestWorkLog?->status->isRunning());
        foreach ($runningUsers as $user) {
            $this->storeLog($user->id, WorkLogStatusEnum::STOPPED);
        }

        return $runningUsers->count();
    }
}
