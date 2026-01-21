<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use App\Services\WorkLogService;
use App\Http\Resources\WorkLogResource;
use App\Http\Resources\WorkLogCalculationResourceCollection;
use App\Http\Requests\CalculateWorkLogRequest;
use App\Services\ResponseService;

class WorkLogController extends Controller
{
    public function __construct(private WorkLogService $service, private readonly ResponseService $response) {}

    public function store(Request $request): JsonResponse
    {
        try {
            $log = $this->service->storeLog(Auth::id(), $request->status);
            return $this->response->success(new WorkLogResource($log));
        } catch (\Exception $e) {
            return $this->response->error($e->getMessage());
        }
    }

    public function calculateWorkMinutes(CalculateWorkLogRequest $request): JsonResponse
    {
        [$start, $end] = $request->getDateRange();
        $targetUserId = $request->getTargetUserId();
        $calc = $this->service->calculateWorkMinutes($targetUserId, $start, $end);


        return $this->response->success(new WorkLogCalculationResourceCollection(collect($calc)));
    }
}
