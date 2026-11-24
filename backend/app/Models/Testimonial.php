<?php

namespace App\Models;

use Database\Factories\TestimonialFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Testimonial shown on the website. `is_demo` items must be labelled as demo content in the UI.
 */
class Testimonial extends Model
{
    /** @use HasFactory<TestimonialFactory> */
    use HasFactory;

    protected $fillable = ['booking_id', 'name', 'city', 'quote', 'rating', 'avatar_path', 'is_demo', 'is_published'];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'is_demo' => 'boolean',
            'is_published' => 'boolean',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Booking, $this> */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
