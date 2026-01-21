<?php

namespace App\Http\Resources;


use Illuminate\Http\Resources\Json\JsonResource;

class WorkLogCalculationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'date' => $this['date'],
            'total_minutes' => $this['total_minutes'],
            'last_status' => $this['last_status'] ?? null,
            'last_status_time' => $this['last_status_time'] ?? null,
            'hours' => $this['hours'],
            'minutes' => $this['minutes'],
        ];
    }
}
