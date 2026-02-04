<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use App\Enums\EmployeeRoleEnum;
use Carbon\Carbon;
use App\Enums\PaginationEnum;

class WorkLogReportsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'user_id' => $this->getTargetUserId(),
        ]);
    }

    public function rules(): array
    {
        return [
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'user_id' => ['nullable', 'exists:users,id'],
            'per_page' => [
                'nullable',
                'integer',
                'min:' . PaginationEnum::MIN_PER_PAGE->value,
                'max:' . PaginationEnum::MAX_PER_PAGE->value
            ],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
    public function getTargetUserId(): int
    {
        $user = $this->user();
        if ($user->role->value === EmployeeRoleEnum::HR->value && $this->filled('user_id')) {
            return (int) $this->input('user_id');
        }
        return $user->id;
    }

    public function messages(): array
    {
        return [
            'start_date.required' => 'Start date is required',
            'start_date.date' => 'Start date must be a date',
            'end_date.required' => 'End date is required',
            'end_date.date' => 'End date must be a date',
            'end_date.after_or_equal' => 'End date must be after or equal to start date',
            'user_id.exists' => 'User not found',
            'per_page.integer' => 'Items per page must be a number',
            'per_page.min' => 'Minimum items per page is ' . PaginationEnum::MIN_PER_PAGE->value,
            'per_page.max' => 'Maximum items per page is ' . PaginationEnum::MAX_PER_PAGE->value,
            'page.integer' => 'Page number must be a number',
            'page.min' => 'Page number must be at least 1',
        ];
    }

}
