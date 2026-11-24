<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

/**
 * Severity of a condition marker.
 */
enum ConditionSeverity: string
{
    use HasValues;

    case Minor = 'minor';

    case Moderate = 'moderate';

    case Major = 'major';
}
