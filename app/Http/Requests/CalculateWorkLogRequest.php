<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use App\Enums\EmployeeRoleEnum;
use Carbon\Carbon;

class CalculateWorkLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:date'],
            'user_id' => ['nullable', 'exists:users,id'],
        ];
    }

    public function getDateRange(): array
    {
        $start = Carbon::parse($this->date);
        $end = $this->filled('end_date') ? Carbon::parse($this->end_date) : $start;
        return [$start, $end];
    }

    public function getTargetUserId(): int
    {
        $user = $this->user();
        if ($user->role->value === EmployeeRoleEnum::HR->value && $this->filled('user_id')) {
            return (int) $this->input('user_id');
        }
        return $user->id;
    }
}
