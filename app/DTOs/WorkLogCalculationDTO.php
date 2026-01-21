<?php

namespace App\DTOs;

use Carbon\Carbon;

readonly class WorkLogCalculationDTO
{
    public function __construct(
        public string $date,
        public int $total_minutes,
        public ?string $last_status,
        public ?Carbon $last_status_time,
        public float $hours,
        public int $minutes
    ) {}

    public function toArray(): array
    {
        return [
            'date' => $this->date,
            'total_minutes' => $this->total_minutes,
            'last_status' => $this->last_status,
            'last_status_time' => $this->last_status_time,
            'hours' => $this->hours,
            'minutes' => $this->minutes,
        ];
    }
}
