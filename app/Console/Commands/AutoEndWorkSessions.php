<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\WorkLogService;
use App\Enums\WorkLogStatusEnum;
use Illuminate\Support\Facades\Log;

class AutoEndWorkSessions extends Command
{
    public function handle(WorkLogService $workLogService)
    {
        $this->info('Starting auto-end check...');

        $users = User::whereHas('workLogs')->get();
        $count = 0;

        foreach ($users as $user) {
            $lastLog = $user->workLogs()->latest()->first();

            if ($lastLog && $lastLog->status->isStart()) {
                $workLogService->storeLog($user->id, WorkLogStatusEnum::END->value);
                $this->info("Ended session for user: {$user->name} (ID: {$user->id})");
                Log::info("Auto-ended work session for user ID: {$user->id}");
                $count++;
            }
        }

        $this->info("Completed. Auto-ended {$count} sessions.");
    }
}
