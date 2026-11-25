<?php

namespace App\Domain\Admin;

use App\Domain\Auth\GuardSession;

/**
 * Sessions on the admin guard `admin`.
 */
final class AdminSession extends GuardSession
{
    public const GUARD = 'admin';

    public function __construct()
    {
        parent::__construct(self::GUARD);
    }
}
