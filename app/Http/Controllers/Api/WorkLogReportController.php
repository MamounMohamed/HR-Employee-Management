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
use App\Models\WorkLogsReport;
use Illuminate\Support\Facades\Auth;

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
}
