<?php

namespace App\Http\Requests\Teams;

use App\Rules\TeamName;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SaveTeamRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', new TeamName],
            'opening_balance' => ['nullable', 'numeric', 'min:0'],
            'expiry_threshold_days' => ['nullable', 'integer', 'min:1'],
            'notification_time' => ['nullable', 'string', 'regex:/^[0-9]{2}:[0-9]{2}$/'],
        ];
    }
}
