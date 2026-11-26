<?php

namespace App\Http\Requests\Admin\Fleet;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

/** One JPG/PNG/WebP image (content-checked, ≤ 2 MB, ≤ 4000 × 4000 px): posters and condition photos. */
class ImageUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** The multipart field: `poster` for the model poster route, `photo` otherwise. */
    public function field(): string
    {
        return $this->routeIs('*.model.poster') ? 'poster' : 'photo';
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            $this->field() => ['required', 'file', 'max:2048', 'mimetypes:image/jpeg,image/png,image/webp', 'dimensions:max_width=4000,max_height=4000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        $field = $this->field();

        return [
            "{$field}.required" => 'Pilih file gambar',
            "{$field}.file" => 'Gambar harus JPG, PNG, atau WebP',
            "{$field}.max" => 'Ukuran gambar maksimal 2 MB',
            "{$field}.mimetypes" => 'Gambar harus JPG, PNG, atau WebP',
            "{$field}.dimensions" => 'Ukuran gambar maksimal 4000 × 4000 piksel',
        ];
    }

    public function contents(): string
    {
        $file = $this->file($this->field());

        return $file instanceof UploadedFile ? (string) file_get_contents((string) $file->getRealPath()) : '';
    }
}
