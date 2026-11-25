<?php

namespace App\Models;

use App\Enums\AdminRole;
use App\Notifications\AdminResetPassword;
use Database\Factories\AdminFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * Admin panel account (Super Admin or branch Staff); guard `admin`, password broker `admins`.
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property AdminRole $role
 * @property int|null $branch_id
 * @property bool $is_active
 */
class Admin extends Authenticatable
{
    /** @use HasFactory<AdminFactory> */
    use HasFactory;

    use Notifiable;
    use SoftDeletes;

    protected $fillable = ['name', 'email', 'password', 'role', 'branch_id', 'is_active', 'last_login_at'];

    protected $hidden = ['password', 'remember_token'];

    protected $attributes = ['version' => 1];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'role' => AdminRole::class,
            'is_active' => 'boolean',
            'last_login_at' => 'immutable_datetime',
            'version' => 'integer',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
            'deleted_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * @param  string  $token
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new AdminResetPassword($token));
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === AdminRole::SuperAdmin;
    }
}
