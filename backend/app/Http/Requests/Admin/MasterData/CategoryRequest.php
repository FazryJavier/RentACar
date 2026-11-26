<?php

namespace App\Http\Requests\Admin\MasterData;

use App\Rules\UniqueLowerName;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;

class CategoryRequest extends FormRequest
{
    use NormalizesName;

    public const NAME_TAKEN = 'Nama kategori sudah ada';

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeName();

        if (is_string($this->input('description'))) {
            $description = trim($this->input('description'));
            $this->merge(['description' => $description === '' ? null : $description]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $updating = $this->isMethod('PATCH');
        $bound = $this->route('category');
        $id = $bound instanceof Model ? $bound->getKey() : $bound;

        return [
            'name' => [$updating ? 'sometimes' : 'required', 'bail', 'string', 'min:2', 'max:60', new UniqueLowerName('categories', self::NAME_TAKEN, is_numeric($id) ? (int) $id : null)],
            'description' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'between:0,999'],
            'version' => [$updating ? 'required' : 'prohibited', 'integer', 'min:1'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama kategori wajib diisi',
            'name.min' => 'Nama kategori 2–60 karakter',
            'name.max' => 'Nama kategori 2–60 karakter',
            'description.max' => 'Deskripsi maksimal 255 karakter',
            'sort_order.*' => 'Urutan harus angka 0–999',
            'version.required' => 'Versi data wajib dikirim',
        ];
    }
}
