<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AllowedGoogleAccount;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AllowedGoogleAccountController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            Gate::authorize('admin');

            return $next($request);
        });
    }

    public function index(): JsonResponse
    {
        return response()->json(
            AllowedGoogleAccount::with('addedBy:id,name')->latest()->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255', 'unique:allowed_google_accounts,email'],
            'name' => ['nullable', 'string', 'max:120'],
        ]);

        $record = AllowedGoogleAccount::create([
            'email' => strtolower($data['email']),
            'name' => $data['name'] ?? null,
            'added_by' => $request->user()->id,
            'active' => true,
        ]);

        $this->audit($request, 'admin.google_allowlist_added', $record->email);

        return response()->json($record, 201);
    }

    public function update(Request $request, AllowedGoogleAccount $allowedGoogleAccount): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'active' => ['sometimes', 'boolean'],
        ]);

        $allowedGoogleAccount->update($data);
        $this->audit($request, 'admin.google_allowlist_updated', $allowedGoogleAccount->email);

        return response()->json($allowedGoogleAccount);
    }

    public function destroy(Request $request, AllowedGoogleAccount $allowedGoogleAccount): JsonResponse
    {
        $email = $allowedGoogleAccount->email;
        $allowedGoogleAccount->delete();
        $this->audit($request, 'admin.google_allowlist_removed', $email);

        return response()->json(['message' => 'Removed.']);
    }

    private function audit(Request $request, string $action, string $email): void
    {
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => $action,
            'meta' => ['email' => $email],
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
