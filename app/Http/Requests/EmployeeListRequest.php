<?php

namespace App\Http\Requests;

use App\Enums\EmployeeRoleEnum;
use App\Enums\PaginationEnum;
use Illuminate\Foundation\Http\FormRequest;

class EmployeeListRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // All authenticated users can view employee list
        return $this->user()?->role->value === EmployeeRoleEnum::HR->value;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => [
                'nullable',
                'integer',
                'min:' . PaginationEnum::MIN_PER_PAGE->value,
                'max:' . PaginationEnum::MAX_PER_PAGE->value
            ],
            'page' => ['nullable', 'integer', 'min:1'],
            'only_inactive' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'search.max' => 'Search term is too long',
            'per_page.integer' => 'Items per page must be a number',
            'per_page.min' => 'Minimum items per page is ' . PaginationEnum::MIN_PER_PAGE->value,
            'per_page.max' => 'Maximum items per page is ' . PaginationEnum::MAX_PER_PAGE->value,
            'page.integer' => 'Page number must be a number',
            'page.min' => 'Page number must be at least 1',
        ];
    }
}
