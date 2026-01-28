<?php

namespace App\DTOs;

use Carbon\Carbon;

readonly class WorkLogReportDTO
{
    public function __construct(
        public int $userId,
        public Carbon $startDate,
        public Carbon $endDate,
        public int $page,
        public int $perPage
    ) {
    }

    public static function fromRequest(array $data): self
    {
        return new self(
            userId: $data['user_id'],
            startDate: Carbon::parse($data['start_date']),
            endDate: Carbon::parse($data['end_date']),
            page: $data['page'],
            perPage: $data['per_page']
        );
    }

    public function toArray(): array
    {
        return [
            'user_id' => $this->userId,
            'start_date' => $this->startDate->format('Y-m-d'),
            'end_date' => $this->endDate->format('Y-m-d'),
            'page' => $this->page,
            'per_page' => $this->perPage
        ];
    }
}
