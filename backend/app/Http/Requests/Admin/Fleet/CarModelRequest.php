<?php

namespace App\Http\Requests\Admin\Fleet;

use App\Domain\Fleet\InvalidModelFile;
use Illuminate\Foundation\Http\FormRequest;

/** Upload or replace a car's .glb model (structure is checked by GlbValidator). */
class CarModelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            // 15 MB = 15360 KB; the GLB structure itself is checked by GlbValidator.
            'file' => ['required', 'file', 'max:15360'],
            ...self::creditRules('required'),
        ];
    }

    /**
     * @return array<string, list<string>>
     */
    public static function creditRules(string $presence): array
    {
        return [
            'source_name' => [$presence, 'string', 'min:2', 'max:120'],
            'source_url' => ['sometimes', 'nullable', 'string', 'max:500', 'url:http,https'],
            'license' => [$presence, 'string', 'min:2', 'max:60'],
            'is_illustrative' => ['sometimes', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'file.required' => 'Pilih file model .glb',
            'file.file' => InvalidModelFile::NOT_GLB,
            'file.max' => InvalidModelFile::NOT_GLB,
            'source_name.required' => 'Isi sumber model',
            'license.required' => 'Isi lisensi model',
        ];
    }

    /**
     * @return array{source_name: string, source_url: ?string, license: string, is_illustrative: bool}
     */
    public function credit(): array
    {
        return [
            'source_name' => trim($this->string('source_name')->toString()),
            'source_url' => $this->filled('source_url') ? trim($this->string('source_url')->toString()) : null,
            'license' => trim($this->string('license')->toString()),
            'is_illustrative' => $this->boolean('is_illustrative'),
        ];
    }
}
