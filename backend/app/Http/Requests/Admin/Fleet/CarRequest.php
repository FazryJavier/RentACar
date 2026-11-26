<?php

namespace App\Http\Requests\Admin\Fleet;

use App\Domain\Admin\AdminSession;
use App\Domain\Fleet\PlateNumber;
use App\Enums\CarStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Models\Admin;
use App\Rules\PlateNumberRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CarRequest extends FormRequest
{
    public const PLATE_TAKEN = 'Plat nomor sudah dipakai mobil lain';

    /** Fields stored on the car (everything else in the request is control data). */
    public const CAR_FIELDS = [
        'brand_id', 'category_id', 'branch_id', 'model_name', 'year', 'plate_number', 'color', 'transmission',
        'fuel_type', 'seats', 'luggage_capacity', 'daily_price', 'deposit', 'status', 'description', 'features',
    ];

    public function authorize(): bool
    {
        return true;
    }

    public function admin(): Admin
    {
        $admin = $this->user(AdminSession::GUARD);
        assert($admin instanceof Admin);

        return $admin;
    }

    protected function prepareForValidation(): void
    {
        foreach (['model_name', 'color', 'description'] as $field) {
            if (is_string($this->input($field))) {
                $this->merge([$field => preg_replace('/[ \t]+/', ' ', trim($this->input($field)))]);
            }
        }

        if (is_string($this->input('plate_number'))) {
            $normalized = PlateNumber::normalize($this->input('plate_number'));
            if ($normalized !== null) {
                $this->merge(['plate_number' => $normalized]);
            }
        }

        if (is_array($this->input('features'))) {
            $this->merge(['features' => array_values(array_map(
                static fn (mixed $feature): mixed => is_string($feature) ? trim($feature) : $feature,
                $this->input('features'),
            ))]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $updating = $this->isMethod('PATCH');
        $required = $updating ? 'sometimes' : 'required';
        $carId = $this->route('car');
        $maxYear = now('Asia/Jakarta')->year + 1;

        return [
            'brand_id' => [$required, 'integer', Rule::exists('brands', 'id')],
            'category_id' => [$required, 'integer', Rule::exists('categories', 'id')],
            // Staf: the branch is always their own (set in the controller), so it is not required.
            'branch_id' => [$this->admin()->isSuperAdmin() ? $required : 'sometimes', 'integer', Rule::exists('branches', 'id')],
            'model_name' => [$required, 'string', 'min:1', 'max:80'],
            'year' => [$required, 'integer', 'between:2000,'.$maxYear],
            'plate_number' => [
                $required, 'string', 'max:12', new PlateNumberRule,
                Rule::unique('cars', 'plate_number')->whereNull('deleted_at')->ignore(is_numeric($carId) ? (int) $carId : null),
            ],
            'color' => [$required, 'string', 'min:2', 'max:30'],
            'transmission' => [$required, Rule::enum(Transmission::class)],
            'fuel_type' => [$required, Rule::enum(FuelType::class)],
            'seats' => [$required, 'integer', 'between:2,16'],
            'luggage_capacity' => ['sometimes', 'nullable', 'integer', 'between:0,20'],
            'daily_price' => [$required, 'integer', 'between:100000,10000000'],
            'deposit' => [$required, 'integer', 'between:0,10000000'],
            'status' => [$updating ? 'sometimes' : 'nullable', Rule::enum(CarStatus::class)],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'features' => ['sometimes', 'array', 'max:12'],
            'features.*' => ['string', 'min:1', 'max:30', 'distinct:ignore_case'],
            'version' => [$updating ? 'required' : 'prohibited', 'integer', 'min:1'],
            'force_cancel_bookings' => [$updating ? 'sometimes' : 'prohibited', 'boolean'],
            'cancel_reason' => ['required_if_accepted:force_cancel_bookings', 'nullable', 'string', 'min:5', 'max:300'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'plate_number.unique' => self::PLATE_TAKEN,
            'year.between' => 'Tahun 2000 s.d. '.(now('Asia/Jakarta')->year + 1),
            'seats.between' => 'Kursi 2–16',
            'daily_price.between' => 'Harga per hari Rp100.000–Rp10.000.000',
            'deposit.between' => 'Deposit Rp0–Rp10.000.000',
            'features.max' => 'Maksimal 12 fasilitas',
            'features.*.distinct' => 'Fasilitas tidak boleh sama',
            'cancel_reason.required_if_accepted' => 'Tulis alasan pembatalan (5–300 karakter)',
            'cancel_reason.min' => 'Alasan pembatalan 5–300 karakter',
        ];
    }

    /**
     * Car attributes from the request; for Staf the branch is always their own.
     *
     * @return array<string, mixed>
     */
    public function carValues(): array
    {
        $values = $this->safe()->only(self::CAR_FIELDS);
        $admin = $this->admin();

        if (! $admin->isSuperAdmin()) {
            unset($values['branch_id']);
            if (! $this->isMethod('PATCH')) {
                $values['branch_id'] = $admin->branch_id;
            }
        }

        if (array_key_exists('status', $values) && $values['status'] === null) {
            unset($values['status']);
        }

        return $values;
    }

    public function forceCancelReason(): ?string
    {
        return $this->boolean('force_cancel_bookings') ? $this->string('cancel_reason')->toString() : null;
    }
}
