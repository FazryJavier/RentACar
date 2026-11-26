<?php

namespace App\Http\Requests\Admin\MasterData;

use App\Rules\UniqueLowerName;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;

class BrandRequest extends FormRequest
{
    use NormalizesName;

    public const NAME_TAKEN = 'Nama merek sudah ada';

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeName();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $updating = $this->isMethod('PATCH');
        $bound = $this->route('brand');
        $id = $bound instanceof Model ? $bound->getKey() : $bound;

        return [
            'name' => [$updating ? 'sometimes' : 'required', 'bail', 'string', 'min:2', 'max:60', new UniqueLowerName('brands', self::NAME_TAKEN, is_numeric($id) ? (int) $id : null)],
            'version' => [$updating ? 'required' : 'prohibited', 'integer', 'min:1'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama merek wajib diisi',
            'name.min' => 'Nama merek 2–60 karakter',
            'name.max' => 'Nama merek 2–60 karakter',
            'version.required' => 'Versi data wajib dikirim',
        ];
    }
}
