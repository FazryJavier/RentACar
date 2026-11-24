<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

/**
 * Who performed an action recorded in histories/audit logs.
 */
enum ActorType: string
{
    use HasValues;

    case Customer = 'customer';

    case Admin = 'admin';

    case System = 'system';
}
