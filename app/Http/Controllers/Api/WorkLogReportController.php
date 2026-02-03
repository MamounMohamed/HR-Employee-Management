<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\WorkLogReportResource;
use App\Services\ResponseService;
use App\Services\WorkLogReportService;
use App\DTOs\WorkLogReportDTO;
use App\Http\Requests\WorkLogReportsRequest;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\UpdateWorkLogReportNotesRequest;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\WorkLogReportDayDetailsRequest;
use App\DTOs\WorkLogReportDayDetailsDTO;

class WorkLogReportController extends Controller
{
    public function __construct(private WorkLogReportService $workLogReportService, private readonly ResponseService $response) {}

    public function index(WorkLogReportsRequest $request): JsonResponse
    {
        $dto = WorkLogReportDTO::fromRequest($request->validated());
        $logs = $this->workLogReportService->getWorkLogsReports($dto);
        return $this->response->success(WorkLogReportResource::collection($logs));
    }

    public function updateNotes(UpdateWorkLogReportNotesRequest $request)
    {
        $workLogReport = $this->workLogReportService->updateOrCreateTodayNotes(
            Auth::id(),
            $request->validated('notes')
        );
        return $this->response->success(new WorkLogReportResource($workLogReport));
    }

    public function dayDetails(WorkLogReportDayDetailsRequest $request)
    {
        $dto = WorkLogReportDayDetailsDTO::fromRequest($request->validated());
        $logs = $this->workLogReportService->getDayDetails($dto);
        return $this->response->success($logs);
    }
}
