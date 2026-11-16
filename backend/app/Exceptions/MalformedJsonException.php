<?php

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Raised when a request declares a JSON body that cannot be parsed.
 */
final class MalformedJsonException extends BadRequestHttpException {}
