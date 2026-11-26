<?php

namespace App\Http\Requests\Admin\MasterData;

use Closure;
use Illuminate\Foundation\Http\FormRequest;

class BranchRequest extends FormRequest
{
    use NormalizesName;

    public const HOURS_MESSAGE = 'Jam tutup harus setelah jam buka';

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeName();

        foreach (['address', 'city'] as $field) {
            if (is_string($this->input($field))) {
                $this->merge([$field => preg_replace('/\s+/', ' ', trim($this->input($field)))]);
            }
        }

        if (is_string($this->input('phone'))) {
            $phone = (string) preg_replace('/[\s\-.()]/', '', trim($this->input('phone')));
            $this->merge(['phone' => str_starts_with($phone, '+62') ? '62'.substr($phone, 3) : $phone]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $updating = $this->isMethod('PATCH');
        $required = $updating ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'min:2', 'max:100'],
            'address' => [$required, 'string', 'min:5', 'max:255'],
            'city' => [$required, 'string', 'min:2', 'max:100'],
            'phone' => [$required, 'string', 'regex:/^\d{8,15}$/'],
            'opening_time' => [$required, 'date_format:H:i'],
            'closing_time' => [$required, 'date_format:H:i', $this->closingAfterOpening()],
            'latitude' => [$required, 'numeric', 'between:-90,90'],
            'longitude' => [$required, 'numeric', 'between:-180,180'],
            'is_active' => ['sometimes', 'boolean'],
            'version' => [$updating ? 'required' : 'prohibited', 'integer', 'min:1'],
        ];
    }

    /** Compares with the submitted opening time, or the stored one on a partial update. */
    private function closingAfterOpening(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            $opening = $this->input('opening_time') ?? $this->storedOpening();
            if (is_string($value) && is_string($opening) && $value <= $opening) {
                $fail(self::HOURS_MESSAGE);
            }
        };
    }

    private function storedOpening(): ?string
    {
        $branch = $this->route('branch');

        return is_object($branch) && isset($branch->opening_time) ? substr((string) $branch->opening_time, 0, 5) : null;
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.*' => 'Nama cabang 2–100 karakter',
            'address.*' => 'Alamat 5–255 karakter',
            'city.*' => 'Kota 2–100 karakter',
            'phone.*' => 'Nomor telepon 8–15 digit',
            'opening_time.*' => 'Jam buka harus berformat JJ:MM',
            'closing_time.date_format' => 'Jam tutup harus berformat JJ:MM',
            'closing_time.required' => 'Jam tutup wajib diisi',
            'latitude.*' => 'Latitude harus -90 sampai 90',
            'longitude.*' => 'Longitude harus -180 sampai 180',
            'version.required' => 'Versi data wajib dikirim',
        ];
    }
}
