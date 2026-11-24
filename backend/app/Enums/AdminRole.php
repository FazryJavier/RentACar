<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

/**
 * Admin panel role.
 */
enum AdminRole: string
{
    use HasValues;

    case SuperAdmin = 'super_admin';

    case Staff = 'staff';
}
