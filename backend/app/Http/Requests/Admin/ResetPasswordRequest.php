<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Customer\ResetPasswordRequest as CustomerRequest;

/** Same input rules and messages as the customer flow. */
class ResetPasswordRequest extends CustomerRequest {}
