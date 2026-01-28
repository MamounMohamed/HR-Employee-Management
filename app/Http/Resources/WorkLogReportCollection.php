<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Request;

class WorkLogReportCollection extends ResourceCollection
{
    public $collects = WorkLogReportResource::class;

    public function toArray(Request $request)
    {
        return [
            'data' => $this->collection,
        ];
    }
}
