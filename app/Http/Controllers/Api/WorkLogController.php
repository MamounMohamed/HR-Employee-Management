<?php

namespace App\Http\Controllers\Api;

use App\DTOs\WorkLogReportDTO;
use App\Http\Controllers\Controller;
use App\Http\Resources\WorkLogReportResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use App\Services\WorkLogService;
use App\Http\Resources\WorkLogResource;
use App\Services\ResponseService;
use App\Http\Requests\StoreWorkLogRequest;
use App\Enums\WorkLogStatusEnum;
use App\Http\Requests\WorkLogReportsRequest;
use App\Http\Resources\WorkLogReportCollection;
use App\Http\Resources\WorkLogCalculationResource;
use Carbon\Carbon;
class WorkLogController extends Controller
{
    public function __construct(private WorkLogService $service, private readonly ResponseService $response)
    {
    }

    public function store(StoreWorkLogRequest $request): JsonResponse
    {
        try {
            $log = $this->service->storeLog(Auth::id(), $request->enum('status', WorkLogStatusEnum::class));
            return $this->response->success(new WorkLogResource($log));
        } catch (\Exception $e) {
            return $this->response->error($e->getMessage());
        }
    }

    public function calculateWorkMinutes(): JsonResponse
    {
        $minutesWorkedToday = $this->service->getWorkedMinutesTodayForCurrentUser();
        return $this->response->success(new WorkLogCalculationResource($minutesWorkedToday));
    }

    public function getWorkLogsReports(WorkLogReportsRequest $request): JsonResponse
    {
        $dto = WorkLogReportDTO::fromRequest($request->validated());
        $logs = $this->service->getWorkLogsReports($dto);
        return $this->response->success(WorkLogReportResource::collection($logs));

    }
}
