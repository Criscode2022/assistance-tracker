-- Presencia — Row-Level Security for Neon Data API
--
-- Applied to the app tables used by CloudSyncService via @neondatabase/neon-js:
--   public.courses
--   public.attendance_records
--   public.user_preferences
--
-- Neon Auth / Better Auth tables (typically neon_auth.*) are left untouched.
--
-- auth.user_id() returns the JWT `sub` claim as text (Neon Data API).
-- Comparisons use ::text so the same policies work whether user_id is text or uuid.
-- `(SELECT auth.user_id())` is wrapped so Postgres can cache the JWT lookup
-- (initPlan) instead of re-evaluating it per row.
--
-- See docs/RLS.md for the policy catalog.

BEGIN;

-- ---------------------------------------------------------------------------
-- Layer 1: table privileges
-- Authenticated JWTs map to the `authenticated` role. Anonymous JWTs map to
-- `anonymous` and must not read or write personal attendance data.
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.courses,
  public.attendance_records,
  public.user_preferences
TO authenticated;

REVOKE ALL ON TABLE
  public.courses,
  public.attendance_records,
  public.user_preferences
FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anonymous') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.courses, public.attendance_records, public.user_preferences FROM anonymous';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Layer 2: enable RLS (blocks all rows until policies exist)
-- ---------------------------------------------------------------------------

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Defaults: stamp new rows with the JWT subject when the client omits user_id
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  rec record;
  default_expr text;
BEGIN
  FOR rec IN
    SELECT table_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('courses', 'attendance_records', 'user_preferences')
      AND column_name = 'user_id'
  LOOP
    IF rec.data_type = 'uuid' THEN
      default_expr := 'auth.uid()';
    ELSE
      default_expr := 'auth.user_id()';
    END IF;
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN user_id SET DEFAULT %s',
      rec.table_name,
      default_expr
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Policies: owner-only CRUD
-- USING  = which existing rows can be SELECT / UPDATE / DELETE
-- WITH CHECK = which new row images can be INSERT / UPDATE
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS courses_owner_crud ON public.courses;
CREATE POLICY courses_owner_crud
  ON public.courses
  FOR ALL
  TO authenticated
  USING (user_id::text = (SELECT auth.user_id()))
  WITH CHECK (user_id::text = (SELECT auth.user_id()));

DROP POLICY IF EXISTS attendance_records_owner_crud ON public.attendance_records;
CREATE POLICY attendance_records_owner_crud
  ON public.attendance_records
  FOR ALL
  TO authenticated
  USING (user_id::text = (SELECT auth.user_id()))
  WITH CHECK (
    user_id::text = (SELECT auth.user_id())
    AND EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE c.id = attendance_records.course_id
        AND c.user_id::text = (SELECT auth.user_id())
    )
  );

DROP POLICY IF EXISTS user_preferences_owner_crud ON public.user_preferences;
CREATE POLICY user_preferences_owner_crud
  ON public.user_preferences
  FOR ALL
  TO authenticated
  USING (user_id::text = (SELECT auth.user_id()))
  WITH CHECK (
    user_id::text = (SELECT auth.user_id())
    AND (
      selected_course_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.courses c
        WHERE c.id = user_preferences.selected_course_id
          AND c.user_id::text = (SELECT auth.user_id())
      )
    )
  );

COMMIT;
