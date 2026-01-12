<?php

namespace App\Http\Requests;

use App\Enums\EmployeeRoleEnum;
use Illuminate\Foundation\Http\FormRequest;

class DeactivateEmployeeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only HR users can deactivate employees
        return $this->user()?->role->value === EmployeeRoleEnum::HR->value;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            // No validation rules needed for the body since we use route parameters
        ];
    }
}
