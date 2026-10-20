# Row-Level Security (RLS)

Presencia exposes `courses`, `attendance_records`, and `user_preferences` through the [Neon Data API](https://neon.com/docs/data-api/get-started). The client (`@neondatabase/neon-js` in `NeonService`) talks to that REST API with the signed-in user's JWT. There is no application backend that filters rows, so **Postgres RLS is the access-control layer**.

The SQL that enables these rules lives in [`sql/rls.sql`](../sql/rls.sql).

## Threat model

| Actor | Postgres role | What they can do |
| --- | --- | --- |
| Signed-in user (valid JWT) | `authenticated` | CRUD **only their own** courses, attendance rows, and preferences |
| Signed-out / anonymous Data API caller | `anonymous` | Nothing on these tables (`REVOKE ALL`) |
| SQL Editor / `neondb_owner` | table owner (`BYPASSRLS`) | Full access; RLS is not applied to the owner unless `FORCE ROW LEVEL SECURITY` is set (it is not) |

`auth.user_id()` is provided by the Data API: it returns the JWT `sub` claim as `text`. `auth.uid()` is the UUID variant, used only as a column **default** when `user_id` is typed `uuid`.

## Tables in scope

These are the tables `CloudSyncService` reads and writes:

| Table | Owner column | Client operations |
| --- | --- | --- |
| `public.courses` | `user_id` | `select`, `insert`, `upsert`, `delete` |
| `public.attendance_records` | `user_id` | `select`, `insert`, `upsert`, `delete` |
| `public.attendance_records` | `course_id` (FK-style check) | Writes must reference a course the same user owns |
| `public.user_preferences` | `user_id` | `select`, `insert`, `upsert` |
| `public.user_preferences` | `selected_course_id` | Must be `NULL` or a course the same user owns |

Neon Auth / Better Auth catalog tables (typically in `neon_auth`) are **not** modified by this script.

## Privileges (Layer 1)

```sql
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON courses, attendance_records, user_preferences
  TO authenticated;

REVOKE ALL ON those tables FROM PUBLIC, anonymous;
```

Without these grants the Data API cannot touch the tables at all. Without the revokes, a future `GRANT` to `PUBLIC` would leak rows independently of RLS.

## Policies (Layer 2)

RLS is **enabled** on each table. With RLS on and no policy, Postgres denies every row to non-owners. Each table then gets a single `FOR ALL TO authenticated` policy.

The JWT lookup is written as `(SELECT auth.user_id())` so Postgres can treat it as a one-time initPlan instead of calling it per row. `user_id::text` keeps the comparison valid for both `text` and `uuid` columns.

### `courses_owner_crud`

| Clause | Rule |
| --- | --- |
| `USING` | `user_id` equals the JWT subject |
| `WITH CHECK` | same — a user cannot insert or reassign a course to another `user_id` |

Effect: list / update / delete / upsert only your courses.

### `attendance_records_owner_crud`

| Clause | Rule |
| --- | --- |
| `USING` | `user_id` equals the JWT subject |
| `WITH CHECK` | `user_id` equals the JWT subject **and** `course_id` exists in `courses` with the same owner |

Effect: you cannot attach attendance to someone else's course, even if you spoof `course_id`. Reads still return your own rows if a course was later deleted (no extra `EXISTS` on `USING`).

### `user_preferences_owner_crud`

| Clause | Rule |
| --- | --- |
| `USING` | `user_id` equals the JWT subject (one preferences row per account) |
| `WITH CHECK` | same owner, and `selected_course_id` is `NULL` or a course you own |

Effect: you cannot point `selected_course_id` at another user's course.

## Defaults

If a client omits `user_id` on insert, the column default is:

- `auth.uid()` when the column is `uuid`
- `auth.user_id()` otherwise

The Angular client currently always sends `user_id` from `NeonService.getUser()`. The default is a safety net, not a substitute for `WITH CHECK`.

## What is intentionally not done

- **`FORCE ROW LEVEL SECURITY`** — left off so the table owner (`neondb_owner`) can still administer data from the Neon SQL Editor.
- **Policies for `anonymous`** — attendance data is private; there is no public catalog.
- **Shared / classroom rows** — the product is single-user cloud sync, not multi-reader courses.
- **RLS on Neon Auth tables** — managed by Neon Auth.

## Applying

Requires Neon MCP (or a Neon API key + SQL) against project `wild-breeze-65639945`, database `neondb`.

```sql
-- After applying, verify:
SELECT c.relname AS table,
       c.relrowsecurity AS rls_enabled,
       p.polname,
       p.polcmd,
       pg_get_expr(p.polqual, p.polrelid) AS using_expr,
       pg_get_expr(p.polwithcheck, p.polrelid) AS check_expr
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relname IN ('courses', 'attendance_records', 'user_preferences')
ORDER BY 1, 3;
```

After schema or policy changes, refresh the Data API schema cache on the branch (Neon Console → Data API → Refresh schema cache).
