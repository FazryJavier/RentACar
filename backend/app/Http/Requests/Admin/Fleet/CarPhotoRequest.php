<?php

namespace App\Http\Requests\Admin\Fleet;

use Illuminate\Foundation\Http\FormRequest;

class CarPhotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            // mimetypes reads the file content (finfo), not the name; dimensions guards against
            // decompression bombs before the image is decoded.
            'photo' => ['required', 'file', 'max:2048', 'mimetypes:image/jpeg,image/png,image/webp', 'dimensions:max_width=6000,max_height=6000'],
            'alt_text' => ['sometimes', 'nullable', 'string', 'max:160'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'photo.required' => 'Pilih file foto',
            'photo.file' => 'Foto harus JPG, PNG, atau WebP',
            'photo.max' => 'Ukuran foto maksimal 2 MB',
            'photo.mimetypes' => 'Foto harus JPG, PNG, atau WebP',
            'photo.dimensions' => 'Ukuran gambar maksimal 6000 × 6000 piksel',
        ];
    }
}
