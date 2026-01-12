<?php

namespace App\Http\Requests;

use App\Enums\EmployeeRoleEnum;
use App\Enums\EmployeeStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only HR users can update employees
        return $this->user()?->role->value === EmployeeRoleEnum::HR->value;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $employeeId = $this->route('id');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255', 'regex:/^[a-zA-Z\s\-\']+$/'],
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($employeeId)
            ],
            'password' => ['sometimes', 'nullable', 'string', 'min:8', 'confirmed'],
            'role' => ['sometimes', 'required', 'string', Rule::in(EmployeeRoleEnum::values())],
            'department' => ['sometimes', 'nullable', 'string', 'max:255', 'regex:/^[a-zA-Z\s]+$/'],
            'status' => ['sometimes', 'required', 'string', Rule::in(EmployeeStatusEnum::values())],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Employee name is required',
            'email.required' => 'Email address is required',
            'email.email' => 'Please provide a valid email address',
            'email.unique' => 'This email address is already registered',
            'password.min' => 'Password must be at least 8 characters',
            'password.confirmed' => 'Password confirmation does not match',
            'role.required' => 'Employee role is required',
            'role.in' => 'Invalid employee role selected',
        ];
    }
}
