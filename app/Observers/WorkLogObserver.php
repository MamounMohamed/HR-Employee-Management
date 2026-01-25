<?php

namespace App\Observers;

use App\Models\WorkLog;
use App\Services\WorkLogService;
use App\Enums\WorkLogStatusEnum;

class WorkLogObserver
{
    public function __construct(private readonly WorkLogService $service) {}

    public function created(WorkLog $workLog)
    {
        if ($workLog->status->isRunning()) {
            return;
        }

        $this->service->syncToDailyReport(
            $workLog->user_id,
            $workLog->created_at
        );
    }
}
