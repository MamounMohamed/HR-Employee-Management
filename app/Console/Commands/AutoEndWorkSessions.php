<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\WorkLogService;
use App\Enums\WorkLogStatusEnum;
use Illuminate\Support\Facades\Log;

class AutoEndWorkSessions extends Command
{
    protected $signature = 'work-log:auto-end';

    protected $description = 'Automatically end work sessions';

    public function handle(WorkLogService $workLogService)
    {
        $this->info('Starting auto-end check...');
        $count = $workLogService->autoEndRunningSessions();
        $this->info("Completed. Auto-ended {$count} sessions.");
        Log::info("Auto-ended {$count} work sessions.");
    }
}
