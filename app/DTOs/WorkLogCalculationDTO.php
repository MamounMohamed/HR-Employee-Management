<?php

namespace App\DTOs;

use Carbon\Carbon;

readonly class WorkLogCalculationDTO
{
    public function __construct(
        public string $date,
        public int $totalMinutes,
        public ?string $lastStatus,
        public ?Carbon $lastStatusTime,
        public float $hours,
        public int $minutes
    ) {}

    public function toArray(): array
    {
        return [
            'date' => $this->date,
            'totalMinutes' => $this->totalMinutes,
            'lastStatus' => $this->lastStatus,
            'lastStatusTime' => $this->lastStatusTime,
            'hours' => $this->hours,
            'minutes' => $this->minutes,
        ];
    }
}
