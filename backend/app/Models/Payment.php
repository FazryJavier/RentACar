<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Database\Factories\PaymentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An uploaded (simulated) bank-transfer proof for a booking.
 */
class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use HasFactory;

    protected $fillable = [
        'booking_id', 'attempt_no', 'amount', 'proof_path', 'proof_mime', 'proof_size', 'status',
        'reviewed_by_admin_id', 'reviewed_at', 'reject_reason',
    ];

    protected $hidden = ['proof_path'];

    protected function casts(): array
    {
        return [
            'status' => PaymentStatus::class,
            'attempt_no' => 'integer',
            'amount' => 'integer',
            'proof_size' => 'integer',
            'reviewed_at' => 'immutable_datetime',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Booking, $this> */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /** @return BelongsTo<Admin, $this> */
    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'reviewed_by_admin_id');
    }
}
