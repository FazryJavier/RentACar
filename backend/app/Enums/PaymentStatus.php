<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

/**
 * Status of an uploaded (simulated) payment proof.
 */
enum PaymentStatus: string
{
    use HasValues;

    case Pending = 'pending';

    case Verified = 'verified';

    case Rejected = 'rejected';
}
