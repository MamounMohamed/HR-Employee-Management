<?php

namespace App\Http\Resources;

use App\DTOs\LatestStatusDto;

class LatestStatusResource
{
    public function __construct(protected LatestStatusDto $latestStatusDto) {}

    public function toArray(): array
    {
        return [
            'status' => $this->latestStatusDto->status,
            'created_at' => $this->latestStatusDto->created_at,
            'is_running' => $this->latestStatusDto->is_running,
        ];
    }
}
