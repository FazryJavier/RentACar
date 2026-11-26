<?php

namespace App\Http\Requests\Admin\Fleet;

use Illuminate\Foundation\Http\FormRequest;

/** Camera, credit and the "illustrative model" flag of an existing model. */
class CarModelUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'camera' => ['sometimes', 'array:position,target'],
            'camera.position' => ['required_with:camera', 'array', 'size:3'],
            'camera.position.*' => ['numeric', 'between:-1000,1000'],
            'camera.target' => ['required_with:camera', 'array', 'size:3'],
            'camera.target.*' => ['numeric', 'between:-1000,1000'],
            ...CarModelRequest::creditRules('sometimes'),
        ];
    }

    /** @return array<string, mixed> */
    public function values(): array
    {
        $values = $this->safe()->only(['camera', 'source_name', 'source_url', 'license', 'is_illustrative']);
        if (isset($values['camera'])) {
            $values['camera'] = [
                'position' => array_map('floatval', (array) $values['camera']['position']),
                'target' => array_map('floatval', (array) $values['camera']['target']),
            ];
        }

        return $values;
    }
}
