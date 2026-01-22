<?php

namespace App\Services;

use App\Models\WorkLog;
use App\Enums\WorkLogStatusEnum;
use App\DTOs\WorkLogCalculationDTO;
use Carbon\Carbon;
use App\Repositories\WorkLogRepository;
use App\Models\User;

class WorkLogService
{
    public function __construct(
        private WorkLogRepository $workLogsRepository
    ) {}

    public function storeLog(int $userId, WorkLogStatusEnum $status): WorkLog
    {
        $lastLog = User::findOrFail($userId)->latestWorkLog;
        if ($lastLog && $lastLog->status === $status->value) {
            throw new \Exception('Invalid action sequence');
        }

        return $this->workLogsRepository->create($userId, $status->value);
    }

    public function getWorkedMinutesByDateRange(int $userId, string $startDate, ?string $endDate = null): array
    {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = $endDate ? Carbon::parse($endDate)->endOfDay() : $start->copy()->endOfDay();

        $logs = $this->workLogsRepository->getLogsForDateRange($userId, $start, $end);

        $results = [];
        foreach ($logs->groupBy(fn($log) => $log->created_at->format('Y-m-d')) as $date => $dayLogs) {
            $results[$date] = $this->createDayWorkReport($date, $dayLogs);
        }

        return $results;
    }
    private function createDayWorkReport(string $date, $dayLogs): WorkLogCalculationDTO
    {
        $totalMinutes = $this->sumMinutesFromStartStopPairs($dayLogs);
        $lastLog = $dayLogs->last();

        return new WorkLogCalculationDTO(
            date: $date,
            totalMinutes: $totalMinutes,
            lastStatus: $lastLog->status->value ?? null,
            lastStatusTime: $dayLogs->last()->created_at,
            hours: floor($totalMinutes / 60),
            minutes: $totalMinutes % 60
        );
    }

    private function sumMinutesFromStartStopPairs($dayLogs): int
    {
        $totalMinutes = 0;
        $sessionStart = null;

        foreach ($dayLogs as $log) {
            if ($log->status->isRunning() && $sessionStart === null) {
                $sessionStart = $log->created_at;
            } elseif ($log->status->isStopped() && $sessionStart !== null) {
                $totalMinutes += Carbon::parse($sessionStart)->diffInMinutes($log->created_at);
                $sessionStart = null;
            }
        }

        return $totalMinutes;
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
