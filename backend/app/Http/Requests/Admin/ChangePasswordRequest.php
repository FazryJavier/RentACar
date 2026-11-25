<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Customer\ChangePasswordRequest as CustomerRequest;

/** Same input rules and messages as the customer flow. */
class ChangePasswordRequest extends CustomerRequest {}
