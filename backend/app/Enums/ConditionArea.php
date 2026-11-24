<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

/**
 * Area of the car a condition marker refers to.
 */
enum ConditionArea: string
{
    use HasValues;

    case Front = 'front';

    case Rear = 'rear';

    case Left = 'left';

    case Right = 'right';

    case Roof = 'roof';

    case Interior = 'interior';

    case Wheel = 'wheel';
}
