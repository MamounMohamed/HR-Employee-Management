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
use App\Models\User;
use Illuminate\Http\Request;

class WorkLogController extends Controller
{
    public function __construct(private WorkLogService $workLogService, private readonly ResponseService $response)
    {
    }

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


    public function latestStatus(Request $request): JsonResponse
    {
        $userId = $request->input('user_id');

        $user = User::with('latestWorkLog')->find($userId);

        if (!$user) {
            return $this->response->error('User not found', 404);
        }

        $latestLog = $user->latestWorkLog;

        return $this->response->success([
            'status' => $latestLog?->status?->value ?? null,
            'created_at' => $latestLog?->created_at?->toISOString() ?? null,
            'is_running' => $latestLog?->status?->isRunning() ?? false,
        ]);
    }
}
