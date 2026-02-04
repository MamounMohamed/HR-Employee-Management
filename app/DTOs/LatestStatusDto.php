<?php

namespace App\DTOs;

class LatestStatusDto
{
    public function __construct(
        public ?string $status,
        public ?string $created_at,
        public bool $is_running,
    ) {}

    public static function fromWorkLog(?object $latestLog): self
    {
        return new self(
            status: $latestLog?->status?->value ?? null,
            created_at: $latestLog?->created_at?->toISOString() ?? null,
            is_running: $latestLog?->status?->isRunning() ?? false,
        );
    }
}
