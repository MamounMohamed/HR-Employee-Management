<?php

namespace App\Services;

use App\DTOs\WorkLogReportDTO;
use App\Models\WorkLogsReport;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Repositories\WorkLogReportRepository;


class WorkLogReportService
{
    public function __construct(private WorkLogReportRepository $workLogReportRepository) {}

    public function getWorkLogsReports(WorkLogReportDTO $dto): LengthAwarePaginator
    {
        return $this->workLogReportRepository->getWorkLogsReports($dto);
    }

    public function updateNotes(WorkLogsReport $workLogReport, ?string $notes): WorkLogsReport
    {
        return $this->workLogReportRepository->updateNotes($workLogReport, $notes ?? '');
    }
}
