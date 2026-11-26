<?php

namespace App\Http\Requests\Admin\MasterData;

use Illuminate\Foundation\Http\FormRequest;

class BrandLogoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            // mimetypes is checked from the file content (finfo), not the name.
            'logo' => ['required', 'file', 'max:1024', 'mimetypes:image/jpeg,image/png,image/webp,image/svg+xml'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'logo.required' => 'Pilih file logo',
            'logo.max' => 'Ukuran logo maksimal 1 MB',
            'logo.mimetypes' => 'Logo harus JPG, PNG, WebP, atau SVG',
            'logo.file' => 'Logo harus JPG, PNG, WebP, atau SVG',
        ];
    }
}
