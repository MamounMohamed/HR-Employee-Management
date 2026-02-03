<?php

namespace App\DTOs;

use Carbon\Carbon;

class WorkLogDayDetailsDTO
{
    public function __construct(
        public ?Carbon $start,
        public ?Carbon $end,
        public array $breaks
    ) {
    }

    public static function empty(): self
    {
        return new self(null, null, []);
    }
}
