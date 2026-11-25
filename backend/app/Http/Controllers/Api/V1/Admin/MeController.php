<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Admin\AdminSession;
use App\Domain\Auth\ChangeAccountPassword;
use App\Enums\ActorType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ChangePasswordRequest;
use App\Http\Resources\AdminResource;
use App\Models\Admin;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The signed-in admin's own profile, role, branch and menu.
 */
final class MeController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return ApiResponse::ok(AdminResource::make($this->admin($request)->load('branch'))->resolve($request), 'Profil berhasil diambil.');
    }

    public function password(ChangePasswordRequest $request, ChangeAccountPassword $change, AdminSession $session): JsonResponse
    {
        $change->handle(
            $request,
            $this->admin($request),
            $session,
            ActorType::Admin,
            'admin.password_changed',
            $request->string('current_password')->toString(),
            $request->string('password')->toString(),
        );

        return ApiResponse::ok(null, 'Kata sandi berhasil diubah.');
    }

    private function admin(Request $request): Admin
    {
        $admin = $request->user(AdminSession::GUARD);
        assert($admin instanceof Admin);

        return $admin;
    }
}
