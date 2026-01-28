<?php

namespace App\Http\Resources;


use Illuminate\Http\Resources\Json\JsonResource;

class WorkLogCalculationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'total_minutes' => $this->totalMinutes,
            'last_status' => $this->lastStatus ?? null,
            'last_status_time' => $this->lastStatusTime ?? null,
        ];
    }
}
