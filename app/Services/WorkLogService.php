<?php

namespace App\Services;

use App\Models\WorkLog;
use App\Enums\WorkLogStatusEnum;
use App\DTOs\WorkLogCalculationDTO;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class WorkLogService
{
    public function storeLog(int $userId, string $status): WorkLog
    {
        $lastLog = WorkLog::where('user_id', $userId)->latest()->first();
        if ($lastLog && $lastLog->status === $status) {
            throw new \Exception('Invalid action sequence');
        }

        return WorkLog::create([
            'user_id' => $userId,
            'status' => $status,
        ]);
    }

    public function calculateWorkMinutes(int $userId, string $startDate, ?string $endDate = null): array
    {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = $endDate ? Carbon::parse($endDate)->endOfDay() : $start->copy()->endOfDay();

        $logs = WorkLog::where('user_id', $userId)
            ->whereBetween('created_at', [$start, $end])
            ->orderBy('created_at')
            ->get();

        $groupedLogs = $logs->groupBy(function ($log) {
            return $log->created_at->format('Y-m-d');
        });

        $results = [];
        foreach ($groupedLogs as $date => $dayLogs) {
            $results[$date] = $this->calculateDayWorkMinutes($date, $dayLogs);
        }

        return $results;
    }
    private function calculateDayWorkMinutes(string $date, $dayLogs): WorkLogCalculationDTO
    {
        $totalMinutes = $this->calculateTotalMinutes($dayLogs);
        $lastStatus = $this->getLastLogStatus($dayLogs);

        return new WorkLogCalculationDTO(
            date: $date,
            total_minutes: $totalMinutes,
            last_status: $lastStatus,
            last_status_time: $dayLogs->last()->created_at,
            hours: floor($totalMinutes / 60),
            minutes: $totalMinutes % 60
        );
    }
    private function getLastLogStatus($dayLogs): ?string
    {
        if ($dayLogs->isEmpty()) {
            return null;
        }

        $lastLog = $dayLogs->last();
        return $lastLog->status->value;
    }


    private function calculateTotalMinutes($dayLogs): int
    {
        $totalMinutes = 0;
        $currentStart = null;

        foreach ($dayLogs as $log) {
            if ($log->status->isStart()) {
                $currentStart = $this->handleStartLog($currentStart, $log);
            }
            if ($log->status->isEnd() && $currentStart !== null) {
                $minutes = $this->calculateSessionMinutes($currentStart, $log);
                $totalMinutes += $minutes;
                $currentStart = null;
            }
        }

        return $totalMinutes;
    }

    private function handleStartLog($currentStart, $log): ?Carbon
    {
        if ($currentStart === null) {
            return Carbon::parse($log->created_at);
        }
        return $currentStart;
    }

    private function calculateSessionMinutes(Carbon $startTime, $endLog): int
    {
        $endTime = Carbon::parse($endLog->created_at);
        return $startTime->diffInMinutes($endTime);
    }
}
