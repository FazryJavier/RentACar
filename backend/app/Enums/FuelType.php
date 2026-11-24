<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

/**
 * Car fuel type.
 */
enum FuelType: string
{
    use HasValues;

    case Gasoline = 'gasoline';

    case Diesel = 'diesel';

    case Hybrid = 'hybrid';

    case Electric = 'electric';
}
