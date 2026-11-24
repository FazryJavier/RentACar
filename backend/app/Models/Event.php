<?php

namespace App\Models;

use Database\Factories\EventFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Lightweight analytics event without personal data.
 */
class Event extends Model
{
    /** @use HasFactory<EventFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    protected $fillable = ['name', 'properties'];

    protected $attributes = ['properties' => '{}'];

    protected function casts(): array
    {
        return ['properties' => 'array', 'created_at' => 'immutable_datetime'];
    }
}
