<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AllowedGoogleAccount;
use App\Models\AuditLog;
use App\Models\GoogleAccount;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            report($e);

            return $this->denied('Google sign-in could not be completed.');
        }

        $email = strtolower((string) $googleUser->getEmail());
        $allowed = AllowedGoogleAccount::whereRaw('lower(email) = ?', [$email])
            ->where('active', true)
            ->first();

        if (! $allowed) {
            $this->audit(null, 'auth.google_denied', ['email' => $email]);

            return $this->denied('This Google account is not approved by an administrator.');
        }

        $user = DB::transaction(function () use ($googleUser, $email, $allowed) {
            $account = GoogleAccount::where('google_id', $googleUser->getId())->first();

            if ($account) {
                $user = $account->user;
            } else {
                $user = User::firstOrCreate([
                    'email' => $email,
                ], [
                    'name' => $googleUser->getName() ?: $allowed->name ?: explode('@', $email)[0],
                    'password' => Str::random(40),
                    'status' => 'active',
                ]);

                GoogleAccount::create([
                    'user_id' => $user->id,
                    'google_id' => $googleUser->getId(),
                    'email' => $email,
                    'name' => $googleUser->getName(),
                    'avatar' => $googleUser->getAvatar(),
                ]);

                $staff = \App\Models\Role::where('name', 'staff')->first();
                if ($staff && $user->roles()->count() === 0) {
                    $user->roles()->attach($staff);
                }
            }

            $user->forceFill(['last_login_at' => now()])->save();

            return $user;
        });

        if ($user->status !== 'active') {
            return $this->denied('This account is inactive.');
        }

        $this->audit($user, 'auth.google_login', ['email' => $email]);
        $token = $user->createToken('api')->plainTextToken;
        $frontend = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');

        return redirect()->away($frontend.'/auth/google/callback?'.http_build_query(['token' => $token]));
    }

    private function denied(string $message): RedirectResponse
    {
        $frontend = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');

        return redirect()->away($frontend.'/login?'.http_build_query(['error' => $message]));
    }

    private function audit(?User $user, string $action, array $meta = []): void
    {
        AuditLog::create([
            'user_id' => $user?->id,
            'action' => $action,
            'meta' => $meta,
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
