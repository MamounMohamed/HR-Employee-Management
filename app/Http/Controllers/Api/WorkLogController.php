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

class WorkLogController extends Controller
{
    public function __construct(private WorkLogService $service) {}

    public function store(Request $request): JsonResponse
    {
        try {
            $log = $this->service->storeLog(Auth::id(), $request->status);
            return response()->json([
                'message' => 'Status recorded',
                'data' => new WorkLogResource($log),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function calculateWorkMinutes(CalculateWorkLogRequest $request): JsonResponse
    {
        [$start, $end] = $request->getDateRange();
        $targetUserId = $request->getTargetUserId();
        $calc = $this->service->calculateWorkMinutes($targetUserId, $start, $end);


        return response()->json([
            'message' => 'Work minutes calculated successfully',
            'data' => new WorkLogCalculationResourceCollection(collect($calc))
        ]);
    }

    public function getLastStatus(): JsonResponse
    {
        try {
            $lastLog = $this->service->getLastLog(Auth::id());
            return response()->json([
                'message' => 'Last status retrieved successfully',
                'data' => new WorkLogResource($lastLog),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
