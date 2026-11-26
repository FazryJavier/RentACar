<?php

namespace App\Http\Requests\Admin\MasterData;

/**
 * Trims and collapses whitespace in `name` before validation.
 */
trait NormalizesName
{
    protected function normalizeName(): void
    {
        if (is_string($this->input('name'))) {
            $this->merge(['name' => preg_replace('/\s+/', ' ', trim($this->input('name')))]);
        }
    }
}
