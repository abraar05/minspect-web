<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'status',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    public function permissions()
    {
        return $this->belongsToMany(Permission::class);
    }

    public function googleAccounts()
    {
        return $this->hasMany(GoogleAccount::class);
    }

    public function roleNames(): Collection
    {
        return $this->roles->pluck('name');
    }

    public function hasRole(string|array $roles): bool
    {
        $roles = is_array($roles) ? $roles : [$roles];

        return $this->roleNames()->intersect($roles)->isNotEmpty();
    }

    public function hasPermission(string $key): bool
    {
        if ($this->permissions->contains('key', $key)) {
            return true;
        }

        return $this->roles->flatMap(fn (Role $role) => $role->permissions)->contains('key', $key);
    }
}
