<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Customer\LoginRequest as CustomerRequest;

/** Same input rules and messages as the customer flow. */
class LoginRequest extends CustomerRequest {}
