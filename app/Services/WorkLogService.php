<?php

namespace App\Services;

use App\Models\WorkLog;
use App\Enums\WorkLogStatusEnum;
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

    public function getLastLog(int $userId): ?WorkLog
    {
        return WorkLog::where('user_id', $userId)->latest()->first();
    }

    private function calculateDayWorkMinutes(string $date, $dayLogs): array
    {
        $totalMinutes = $this->calculateTotalMinutes($dayLogs);

        return [
            'date' => $date,
            'total_minutes' => $totalMinutes,
            'hours' => floor($totalMinutes / 60),
            'minutes' => $totalMinutes % 60,
        ];
    }

    private function calculateTotalMinutes($dayLogs): int
    {
        $totalMinutes = 0;
        $currentStart = null;

        foreach ($dayLogs as $log) {
            if ($this->isStartLog($log)) {
                $currentStart = $this->handleStartLog($currentStart, $log);
            }
            if ($this->isEndLog($log) && $currentStart !== null) {
                $minutes = $this->calculateSessionMinutes($currentStart, $log);
                $totalMinutes += $minutes;
                $currentStart = null;
            }
        }

        $this->handleUnmatchedStart($currentStart);

        return $totalMinutes;
    }

    private function isStartLog($log): bool
    {
        return $log->status === WorkLogStatusEnum::START;
    }

    private function isEndLog($log): bool
    {
        return $log->status === WorkLogStatusEnum::END;
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

    private function handleUnmatchedStart(?Carbon $currentStart): void
    {
        if ($currentStart !== null) {
            Log::warning('Unmatched START at ' . $currentStart);
        }
    }
}
