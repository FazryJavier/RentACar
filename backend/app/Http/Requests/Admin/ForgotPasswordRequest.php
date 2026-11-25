<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Customer\ForgotPasswordRequest as CustomerRequest;

/** Same input rules and messages as the customer flow. */
class ForgotPasswordRequest extends CustomerRequest {}
