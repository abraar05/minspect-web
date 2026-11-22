<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->string('name')->toString(),
                'email' => $request->string('email')->toString(),
                'password' => $request->string('password')->toString(),
                'phone' => $request->input('phone') ?: null,
                'status' => 'active',
            ]);

            $staff = Role::where('name', 'staff')->first();
            if ($staff) {
                $user->roles()->attach($staff);
            }

            return $user;
        });

        $this->audit($user, 'user.registered', ['email' => $user->email], $request);

        return response()->json([
            'user' => new UserResource($user->load('roles', 'permissions')),
            'token' => $user->createToken('api')->plainTextToken,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (! Auth::attempt($credentials)) {
            $this->audit(null, 'auth.login_failed', ['email' => $request->string('email')->toString()], $request);

            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $user = Auth::user();
        if ($user->status !== 'active') {
            Auth::logout();

            return response()->json(['message' => 'This account is inactive.'], 403);
        }

        $user->forceFill(['last_login_at' => now()])->save();
        $this->audit($user, 'auth.login', [], $request);

        return response()->json([
            'user' => new UserResource($user->load('roles', 'permissions')),
            'token' => $user->createToken('api')->plainTextToken,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();
        $this->audit($request->user(), 'auth.logout', [], $request);

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->load('roles', 'permissions'));
    }

    private function audit(?User $user, string $action, array $meta, Request $request): void
    {
        AuditLog::create([
            'user_id' => $user?->id,
            'action' => $action,
            'meta' => $meta,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
