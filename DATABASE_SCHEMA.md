# Database Schema — @mInspect

## Current tables (batch 1)

### users
`id`, `name`, `email` (unique), `email_verified_at`, `password`, `phone`, `status`, `last_login_at`, `remember_token`, timestamps.

### roles
`id`, `name` (unique), `description`, timestamps. Seeded: `admin`, `manager`, `accountant`, `staff`.

### permissions
`id`, `key` (unique), `module`, `description`, timestamps.

### role_user / permission_role
Pivot tables with unique pairs and cascading deletes.

### personal_access_tokens
Sanctum tokens: `id`, `tokenable_type`, `tokenable_id`, `name`, `token` (unique), `abilities`, `last_used_at`, `expires_at`, timestamps.

### password_reset_tokens
`email` (primary), `token`, `created_at`.

### audit_logs
`id`, `user_id` (nullable), `action`, `subject_type`, `subject_id`, `meta` (json), `ip`, `user_agent`, timestamps. Indexed by `action` and subject.

## Current tables (batch 2)

### allowed_google_accounts
`id`, `email` (unique), `name` (nullable), `added_by` (nullable FK → `users.id`), `active` (boolean), timestamps.
Admins manage this table; Google sign-in is denied unless a matching active email exists.

### google_accounts
`id`, `user_id` (FK → `users.id`, cascade delete), `google_id` (unique), `email`, `name`, `avatar`, timestamps.
Links a Google identity to a local user after allowlist approval.

## Planned tables (batch 3 onward)
`categories`, `brands`, `products`, `product_variants`, `suppliers`, `customers`, `warehouses`, `stock_balances`, `stock_movements`, `purchases`, `purchase_items`, `sales`, `sale_items`, `returns`, `return_items`, `accounts`, `journal_entries`, `journal_lines`.

All structure changes must be migrations. No manual schema edits.
