<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;
use App\Models\User;

class WorkLogCalculationResourceCollection extends ResourceCollection
{
    public $collects = WorkLogCalculationResource::class;

    public function toArray($request): array
    {
        return [
            'user' => new EmployeeResource($request->user_id ? User::find($request->user_id) : $request->user()),
            'work_logs' => $this->collection,
        ];
    }
}
