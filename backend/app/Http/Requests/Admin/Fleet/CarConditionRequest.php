<?php

namespace App\Http\Requests\Admin\Fleet;

use App\Enums\ConditionArea;
use App\Enums\ConditionSeverity;
use App\Rules\NotFutureWibDate;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CarConditionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('description'))) {
            $this->merge(['description' => trim($this->input('description'))]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $required = $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'area' => [$required, Rule::enum(ConditionArea::class)],
            'severity' => [$required, Rule::enum(ConditionSeverity::class)],
            'description' => [$required, 'string', 'min:5', 'max:300'],
            'inspected_on' => [$required, 'date_format:Y-m-d', new NotFutureWibDate],
            'position' => ['sometimes', 'array', 'size:3'],
            'position.*' => ['numeric', 'between:-1000,1000'],
            'normal' => ['sometimes', 'array', 'size:3'],
            'normal.*' => ['numeric', 'between:-1000,1000'],
            'is_resolved' => [$this->isMethod('PATCH') ? 'sometimes' : 'prohibited', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'area.required' => 'Pilih area',
            'area.enum' => 'Pilih area',
            'severity.required' => 'Pilih tingkat kerusakan',
            'severity.enum' => 'Pilih tingkat kerusakan',
            'description.required' => 'Deskripsi 5–300 karakter',
            'description.min' => 'Deskripsi 5–300 karakter',
            'description.max' => 'Deskripsi 5–300 karakter',
            'inspected_on.required' => 'Isi tanggal inspeksi',
            'inspected_on.date_format' => 'Format tanggal inspeksi tidak valid',
            'position.size' => 'Klik titik pada model',
            'normal.size' => 'Klik titik pada model',
        ];
    }

    /** @return array<string, mixed> */
    public function values(): array
    {
        $values = $this->safe()->only(['area', 'severity', 'description', 'inspected_on', 'position', 'normal', 'is_resolved']);
        foreach (['position', 'normal'] as $key) {
            if (isset($values[$key])) {
                $values[$key] = array_map(static fn (mixed $value): float => round((float) $value, 4), array_values((array) $values[$key]));
            }
        }

        return $values;
    }
}
