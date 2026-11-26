<?php

namespace App\Http\Requests\Admin\Fleet;

use Carbon\CarbonImmutable;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

class CarInspectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'inspected_at' => ['required', 'date', function (string $attribute, mixed $value, Closure $fail): void {
                if (is_string($value) && strtotime($value) !== false && CarbonImmutable::parse($value)->isFuture()) {
                    $fail('Waktu inspeksi tidak boleh di masa depan');
                }
            }],
            'odometer_km' => ['required', 'integer', 'between:0,2000000'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'inspected_at.required' => 'Isi waktu inspeksi',
            'odometer_km.required' => 'Isi kilometer',
            'odometer_km.between' => 'Kilometer 0–2.000.000',
        ];
    }

    public function inspectedAt(): CarbonImmutable
    {
        return CarbonImmutable::parse($this->string('inspected_at')->toString());
    }
}
