<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_user_can_register_and_receive_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test Staff',
            'email' => 'staff@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'staff@example.test')
            ->assertJsonStructure(['user' => ['id', 'name', 'email', 'roles'], 'token']);

        $this->assertDatabaseHas('users', ['email' => 'staff@example.test']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'user.registered']);
        $this->assertTrue(User::first()->hasRole('staff'));
    }

    public function test_registration_validates_input(): void
    {
        $this->postJson('/api/register', [
            'name' => '',
            'email' => 'not-an-email',
            'password' => 'short',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_user_can_login_and_fetch_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'login@example.test',
            'password' => 'password123',
        ]);

        $login = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $login->assertOk()->assertJsonStructure(['token', 'user']);
        $token = $login->json('token');

        $this->withToken($token)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('email', $user->email);

        $this->assertDatabaseHas('audit_logs', ['action' => 'auth.login']);
    }

    public function test_login_rejects_bad_credentials(): void
    {
        $this->postJson('/api/login', [
            'email' => 'none@example.test',
            'password' => 'wrong-password',
        ])->assertUnauthorized();
    }

    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('api')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/logout')
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
