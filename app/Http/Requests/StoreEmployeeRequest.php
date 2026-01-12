<?php

namespace App\Http\Requests;

use App\Enums\EmployeeRoleEnum;
use App\Enums\EmployeeStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only HR users can create employees
        return $this->user()?->role->value === EmployeeRoleEnum::HR->value;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z\s\-\']+$/'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', 'string', Rule::in(EmployeeRoleEnum::values())],
            'department' => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-Z\s]+$/'],
            'status' => ['nullable', 'string', Rule::in(EmployeeStatusEnum::values())],
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
            'password.required' => 'Password is required',
            'password.min' => 'Password must be at least 8 characters',
            'password.confirmed' => 'Password confirmation does not match',
            'role.required' => 'Employee role is required',
            'role.in' => 'Invalid employee role selected',
        ];
    }
}
