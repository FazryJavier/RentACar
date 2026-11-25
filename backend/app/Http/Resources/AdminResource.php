<?php

namespace App\Http\Resources;

use App\Enums\AdminMenu;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The signed-in admin: profile, role, branch (Staf) and the menu keys the role may use.
 *
 * @property-read Admin $resource
 */
class AdminResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $admin = $this->resource;
        $branch = $admin->branch;

        return [
            'id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => $admin->role->value,
            'branch' => $branch === null ? null : ['id' => $branch->id, 'name' => $branch->name],
            'menu' => AdminMenu::keysFor($admin->role),
            'created_at' => $admin->created_at?->utc()->toIso8601ZuluString(),
        ];
    }
}
