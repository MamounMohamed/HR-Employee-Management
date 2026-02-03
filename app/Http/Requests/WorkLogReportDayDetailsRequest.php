<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WorkLogReportDayDetailsRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'user_id' => ['required', 'exists:users,id'],
            'work_date' => ['required', 'date'],
        ];
    }
}
