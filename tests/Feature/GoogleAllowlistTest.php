<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GoogleAllowlistTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_manage_google_allowlist(): void
    {
        $admin = User::factory()->create();
        $admin->roles()->attach(Role::where('name', 'admin')->first());

        Sanctum::actingAs($admin)
            ->postJson('/api/admin/allowed-google-accounts', [
                'email' => 'User@Example.com',
                'name' => 'Approved User',
            ])
            ->assertCreated()
            ->assertJsonPath('email', 'user@example.com');

        Sanctum::actingAs($admin)
            ->getJson('/api/admin/allowed-google-accounts')
            ->assertOk()
            ->assertJsonCount(1);

        $recordId = \App\Models\AllowedGoogleAccount::first()->id;

        Sanctum::actingAs($admin)
            ->patchJson('/api/admin/allowed-google-accounts/'.$recordId, ['active' => false])
            ->assertOk()
            ->assertJsonPath('active', false);

        Sanctum::actingAs($admin)
            ->deleteJson('/api/admin/allowed-google-accounts/'.$recordId)
            ->assertOk();
    }

    public function test_non_admin_cannot_manage_allowlist(): void
    {
        $staff = User::factory()->create();

        Sanctum::actingAs($staff)
            ->getJson('/api/admin/allowed-google-accounts')
            ->assertForbidden();
    }
}
