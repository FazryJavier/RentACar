<?php

namespace App\Support\Logging;

use Illuminate\Log\Logger;
use Monolog\Logger as Monolog;

/**
 * Logging channel "tap" that installs the redaction processor (see config/logging.php).
 */
final class RedactSensitiveDataTap
{
    public function __invoke(Logger $logger): void
    {
        $monolog = $logger->getLogger();

        if ($monolog instanceof Monolog) {
            $monolog->pushProcessor(new RedactSensitiveData);
        }
    }
}
