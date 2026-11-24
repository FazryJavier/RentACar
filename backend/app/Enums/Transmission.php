<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

/**
 * Car transmission type.
 */
enum Transmission: string
{
    use HasValues;

    case Manual = 'manual';

    case Automatic = 'automatic';
}
