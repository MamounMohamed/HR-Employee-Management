<?php

namespace App\DTOs;

use Carbon\Carbon;

class WorkLogReportDayDetailsDTO
{
    public function __construct(
        public int $userId,
        public Carbon $workDate
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            userId: $data['user_id'],
            workDate: Carbon::parse($data['work_date'])
        );
    }
}
