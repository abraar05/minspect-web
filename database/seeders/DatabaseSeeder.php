<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);

        $email = env('SEED_ADMIN_EMAIL');
        $password = env('SEED_ADMIN_PASSWORD');

        if ($email && $password) {
            $admin = User::firstOrCreate([
                'email' => $email,
            ], [
                'name' => env('SEED_ADMIN_NAME', 'Administrator'),
                'password' => Hash::make($password),
                'status' => 'active',
            ]);

            $role = Role::where('name', 'admin')->first();
            if ($role) {
                $admin->roles()->syncWithoutDetaching($role);
            }
        }
    }
}
