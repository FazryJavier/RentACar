<?php

namespace App\Http\Middleware;

use App\Domain\Auth\Exceptions\AccountBlocked;
use App\Domain\Customer\CustomerSession;
use App\Models\Customer;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ends the session of a customer who was blocked while signed in.
 */
final class EnsureCustomerNotBlocked
{
    public function __construct(private readonly CustomerSession $session) {}

    public function handle(Request $request, Closure $next): Response
    {
        $customer = $request->user(CustomerSession::GUARD);

        if ($customer instanceof Customer && $customer->is_blocked) {
            $this->session->end($request);

            throw new AccountBlocked;
        }

        return $next($request);
    }
}
