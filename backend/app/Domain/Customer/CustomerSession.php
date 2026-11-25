<?php

namespace App\Domain\Customer;

use App\Domain\Auth\GuardSession;

/**
 * Sessions on the customer guard `web`.
 */
final class CustomerSession extends GuardSession
{
    public const GUARD = 'web';

    public function __construct()
    {
        parent::__construct(self::GUARD);
    }
}
