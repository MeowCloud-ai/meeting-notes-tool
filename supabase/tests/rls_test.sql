-- RLS Verification Tests
-- Run with: supabase db test
-- These tests verify RLS policies at the database level

BEGIN;

-- Setup: Create test users
SELECT tests.create_supabase_user('user-a', 'usera@test.com');
SELECT tests.create_supabase_user('user-b', 'userb@test.com');
SELECT tests.create_supabase_user('user-c', 'userc@test.com');

-- Setup: Create test orgs
INSERT INTO organizations (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Org Alpha'),
  ('00000000-0000-0000-0000-000000000002', 'Org Beta');

-- Setup: Create test recordings
-- User A in Org 1
SELECT tests.authenticate_as('user-a');
INSERT INTO recordings (id, user_id, org_id, title) VALUES
  ('00000000-0000-0000-0001-000000000001', tests.get_supabase_uid('user-a'), '00000000-0000-0000-0000-000000000001', 'UserA Recording');

-- User B in Org 1
SELECT tests.authenticate_as('user-b');
INSERT INTO recordings (id, user_id, org_id, title) VALUES
  ('00000000-0000-0000-0001-000000000002', tests.get_supabase_uid('user-b'), '00000000-0000-0000-0000-000000000001', 'UserB Recording');

-- User C in Org 2
SELECT tests.authenticate_as('user-c');
INSERT INTO recordings (id, user_id, org_id, title) VALUES
  ('00000000-0000-0000-0001-000000000003', tests.get_supabase_uid('user-c'), '00000000-0000-0000-0000-000000000002', 'UserC Recording');

-- ============================================================
-- TEST 1: Same-org users can see each other's recordings
-- ============================================================
SELECT tests.authenticate_as('user-a');

SELECT is(
  (SELECT count(*) FROM recordings WHERE org_id = '00000000-0000-0000-0000-000000000001')::int,
  2,
  'User A can see both Org 1 recordings'
);

-- ============================================================
-- TEST 2: Cross-org isolation
-- ============================================================
SELECT is(
  (SELECT count(*) FROM recordings WHERE user_id = tests.get_supabase_uid('user-c'))::int,
  0,
  'User A cannot see User C recordings (different org)'
);

-- ============================================================
-- TEST 3: User cannot update others' recordings
-- ============================================================
SELECT tests.authenticate_as('user-b');

UPDATE recordings SET title = 'Hacked!' WHERE id = '00000000-0000-0000-0001-000000000001';

SELECT tests.authenticate_as('user-a');
SELECT is(
  (SELECT title FROM recordings WHERE id = '00000000-0000-0000-0001-000000000001'),
  'UserA Recording',
  'User B cannot update User A recording'
);

-- ============================================================
-- TEST 4: User cannot delete others' recordings
-- ============================================================
SELECT tests.authenticate_as('user-c');

DELETE FROM recordings WHERE id = '00000000-0000-0000-0001-000000000001';

SELECT tests.authenticate_as('user-a');
SELECT is(
  (SELECT count(*) FROM recordings WHERE id = '00000000-0000-0000-0001-000000000001')::int,
  1,
  'User C cannot delete User A recording'
);

-- ============================================================
-- TEST 5: Meet usage is private
-- ============================================================
SELECT tests.authenticate_as('user-a');
INSERT INTO meet_usage (user_id, plan_type) VALUES (tests.get_supabase_uid('user-a'), 'free');

SELECT tests.authenticate_as('user-b');
SELECT is(
  (SELECT count(*) FROM meet_usage WHERE user_id = tests.get_supabase_uid('user-a'))::int,
  0,
  'User B cannot see User A usage'
);

-- Cleanup
SELECT tests.clear_authentication();
ROLLBACK;
