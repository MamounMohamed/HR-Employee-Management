<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Request;

class WorkLogReportDayDetailsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            "start" => $this->start,
            "end" => $this->end,
            "breaks" => $this->breaks,
        ];
    }
}
