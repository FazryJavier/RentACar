<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

/**
 * Operational status of a car.
 */
enum CarStatus: string
{
    use HasValues;

    case Active = 'active';

    case Maintenance = 'maintenance';

    case Inactive = 'inactive';
}
