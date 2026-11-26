<?php

namespace App\Http\Requests\Admin\Fleet;

use Illuminate\Foundation\Http\FormRequest;

class CarPhotoOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'photo_ids' => ['required', 'array', 'min:1', 'max:5'],
            'photo_ids.*' => ['integer', 'distinct'],
        ];
    }

    /** @return list<int> */
    public function photoIds(): array
    {
        /** @var list<int|string> $ids */
        $ids = $this->validated('photo_ids');

        return array_map('intval', $ids);
    }
}
