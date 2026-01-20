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
            'hours' => $this['hours'],
            'minutes' => $this['minutes'],
        ];
    }
}
