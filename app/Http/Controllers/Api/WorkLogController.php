<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use App\Services\WorkLogService;
use App\Http\Resources\WorkLogResource;
use App\Services\ResponseService;
use App\Http\Requests\StoreWorkLogRequest;
use App\Enums\WorkLogStatusEnum;
use App\Http\Resources\WorkLogCalculationResource;

class WorkLogController extends Controller
{
    public function __construct(private WorkLogService $workLogService, private readonly ResponseService $response) {}

    public function store(StoreWorkLogRequest $request): JsonResponse
    {
        try {
            $log = $this->workLogService->storeLog(Auth::id(), $request->enum('status', WorkLogStatusEnum::class));
            return $this->response->success(new WorkLogResource($log));
        } catch (\Exception $e) {
            return $this->response->error($e->getMessage());
        }
    }

    public function calculateWorkMinutes(): JsonResponse
    {
        $minutesWorkedToday = $this->workLogService->getWorkedMinutesTodayForCurrentUser();
        return $this->response->success(new WorkLogCalculationResource($minutesWorkedToday));
    }
}
