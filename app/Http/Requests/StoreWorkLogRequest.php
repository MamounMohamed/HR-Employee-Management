<?php

namespace App\Http\Requests;

use App\Enums\WorkLogStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWorkLogRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(WorkLogStatusEnum::class)],
        ];
    }
}
