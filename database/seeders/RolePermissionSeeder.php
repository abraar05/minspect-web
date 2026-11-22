<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'users.view', 'users.manage',
            'products.view', 'products.manage',
            'inventory.view', 'inventory.adjust',
            'customers.view', 'customers.manage',
            'suppliers.view', 'suppliers.manage',
            'purchases.view', 'purchases.manage',
            'sales.view', 'sales.manage',
            'returns.view', 'returns.manage',
            'accounting.view', 'accounting.manage',
            'reports.view', 'settings.manage',
        ];

        DB::transaction(function () use ($permissions) {
            foreach ($permissions as $key) {
                [$module] = explode('.', $key);
                Permission::firstOrCreate([
                    'key' => $key,
                ], [
                    'module' => $module,
                    'description' => ucfirst(str_replace('.', ' ', $key)),
                ]);
            }

            $roles = [
                'admin' => Permission::all(),
                'manager' => Permission::whereNotIn('key', ['users.manage', 'settings.manage'])->get(),
                'accountant' => Permission::whereIn('module', ['accounting', 'reports', 'sales', 'purchases', 'returns'])->get(),
                'staff' => Permission::whereIn('module', ['products', 'inventory', 'customers', 'suppliers', 'sales'])->get(),
            ];

            foreach ($roles as $name => $granted) {
                $role = Role::firstOrCreate([
                    'name' => $name,
                ], [
                    'description' => ucfirst($name).' role',
                ]);

                $role->permissions()->sync($granted->pluck('id'));
            }
        });
    }
}
