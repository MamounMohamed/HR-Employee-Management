<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use App\Services\WorkLogService;
use App\Http\Resources\WorkLogResource;
use App\Http\Resources\WorkLogCalculationResourceCollection;
use App\Http\Requests\CalculateWorkLogRequest;
use App\Services\ResponseService;
use App\Http\Requests\StoreWorkLogRequest;
use App\Enums\WorkLogStatusEnum;

class WorkLogController extends Controller
{
    public function __construct(private WorkLogService $service, private readonly ResponseService $response) {}

    public function store(StoreWorkLogRequest $request): JsonResponse
    {
        try {
            $log = $this->service->storeLog(Auth::id(), $request->enum('status', WorkLogStatusEnum::class));
            return $this->response->success(new WorkLogResource($log));
        } catch (\Exception $e) {
            return $this->response->error($e->getMessage());
        }
    }

    public function calculateWorkMinutes(CalculateWorkLogRequest $request): JsonResponse
    {
        [$start, $end] = $request->getDateRange();
        $targetUserId = $request->getTargetUserId();
        $dailyWorkSummaries = $this->service->getWorkedMinutesByDateRange($targetUserId, $start, $end);


        return $this->response->success(new WorkLogCalculationResourceCollection(collect($dailyWorkSummaries)));
    }
}
