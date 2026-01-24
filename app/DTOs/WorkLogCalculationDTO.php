<?php

namespace App\DTOs;

use Carbon\Carbon;

readonly class WorkLogCalculationDTO
{
    public function __construct(
        public int $totalMinutes,
        public ?string $lastStatus,
        public ?Carbon $lastStatusTime,
    ) {
    }

    public function toArray(): array
    {
        return [
            'totalMinutes' => $this->totalMinutes,
            'lastStatus' => $this->lastStatus,
            'lastStatusTime' => $this->lastStatusTime,
        ];
    }
}
