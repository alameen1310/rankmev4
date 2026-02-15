# RankMe — Complete Backend Migration Guide

## Your Current Data Summary

| Table | Rows |
|-------|------|
| profiles | 30 |
| questions | 137 |
| subjects | 8 |
| badges | 15 |
| quiz_sessions | 490 |
| user_answers | 2,428 |
| leaderboard_entries | 3,092 |
| direct_messages | 141 |
| battles | 17 |
| battle_participants | 30 |
| daily_challenges | 13 |
| daily_challenge_attempts | 7 |
| daily_leaderboards | 7 |
| daily_streaks | 22 |
| friendships | 22 |
| friend_requests | 20 |
| notifications | 128 |
| user_badges | 80 |
| admin_actions | 19 |
| message_reactions | 6 |
| user_roles | 1 |
| payments | 0 |
| subscriptions | 0 |
| quiz_results | 0 |
| user_progress | 0 |
| user_achievements | 0 |
| ai_summary_jobs | 0 |
| battle_answers | 0 |
| battle_questions | 0 |
| battle_live_state | 0 |

---

## Step-by-Step Migration

### Step 1: Create a New Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose your org, name it "RankMe", pick a strong database password, and select a region close to your users
4. Save the **Project URL** and **anon key** from Settings → API

### Step 2: Run the Schema Migration

Option A — **Supabase Dashboard SQL Editor** (easiest):
1. Open your new project dashboard → SQL Editor
2. Paste the entire contents of `migration/001_complete_schema.sql`
3. Click **Run**

Option B — **Supabase CLI**:
```bash
# Install CLI
npm install -g supabase

# Link to your new project
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

### Step 3: Export Data from Current Backend

Since you cannot access the Supabase dashboard directly, I'll need to export each table's data for you. Ask me to run data exports and I'll output them as SQL INSERT statements or JSON that you can import.

**Tables with data to export** (in dependency order):
1. `subjects` (8 rows)
2. `badges` (15 rows)
3. `profiles` (30 rows) — ⚠️ see auth note below
4. `questions` (137 rows)
5. `friendships` (22 rows)
6. `friend_requests` (20 rows)
7. `battles` (17 rows)
8. `battle_participants` (30 rows)
9. `quiz_sessions` (490 rows)
10. `user_answers` (2,428 rows)
11. `leaderboard_entries` (3,092 rows)
12. `daily_challenges` (13 rows)
13. `daily_challenge_attempts` (7 rows)
14. `daily_leaderboards` (7 rows)
15. `daily_streaks` (22 rows)
16. `direct_messages` (141 rows)
17. `message_reactions` (6 rows)
18. `notifications` (128 rows)
19. `user_badges` (80 rows)
20. `user_roles` (1 row)
21. `admin_actions` (19 rows)

### Step 4: Auth / Password Migration

⚠️ **CRITICAL: Password hashes CANNOT be exported** from Supabase's `auth.users` table via the client API. Here's the strategy:

**Recommended approach — Forced Password Reset:**

1. Export all profile data (usernames, emails, avatars, stats)
2. In your new project, users sign up fresh or use "Forgot Password"
3. On the new project, pre-create profiles with matching UUIDs using the service role key
4. Send a bulk password reset email to all users

**Alternative — If you get direct DB access:**
If you can get a database dump (pg_dump) from the current project, password hashes from `auth.users` can be migrated directly since Supabase uses bcrypt.

### Step 5: Configure Auth Providers

In your new Supabase dashboard → Authentication → Providers:
1. Enable **Email** provider
2. Set email confirmation behavior as desired
3. Set **Site URL** to your deployed domain
4. Add **Redirect URLs**: `https://yourdomain.com/*`

### Step 6: Set Edge Function Secrets

In your new project dashboard → Edge Functions → Secrets, add:
- `PAYSTACK_SECRET_KEY` — your Paystack secret key

### Step 7: Deploy Edge Functions

```bash
# From your project root
supabase functions deploy generate-questions
supabase functions deploy daily-challenge
supabase functions deploy initialize-payment
supabase functions deploy verify-payment
supabase functions deploy paystack-webhook
supabase functions deploy reset-leaderboard
supabase functions deploy delete-user
supabase functions deploy adjust-points
supabase functions deploy toggle-admin
supabase functions deploy expire-premium
supabase functions deploy check-premium-status
supabase functions deploy friend-suggestions
```

### Step 8: Update Frontend Configuration

Update your `.env` file (or environment variables in your hosting platform):

```env
VITE_SUPABASE_URL=https://YOUR_NEW_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_new_anon_key
VITE_SUPABASE_PROJECT_ID=YOUR_NEW_PROJECT_REF
```

### Step 9: Create Storage Bucket

The migration SQL already creates the `chat-media` bucket. Verify it exists in Storage settings. If you have existing chat media files, they'll need to be re-uploaded or migrated separately.

### Step 10: Verify

1. ✅ Sign up a test user → profile auto-created
2. ✅ Take a quiz → scores update
3. ✅ Check leaderboard → populated
4. ✅ Send a chat message → realtime works
5. ✅ Daily challenge → generates and scores
6. ✅ Badges → awarded correctly

---

## Files Provided

| File | Purpose |
|------|---------|
| `migration/001_complete_schema.sql` | Complete schema: tables, functions, triggers, RLS, realtime, storage |
| `migration/MIGRATION_GUIDE.md` | This guide |

---

## What Cannot Be Auto-Migrated

1. **auth.users passwords** — Users must reset passwords (or you need a pg_dump)
2. **Storage files** (chat-media bucket) — Need manual re-upload
3. **Edge function environment** — Secrets must be re-added manually
4. **Lovable Cloud binding** — Your Lovable project will still reference the old Cloud backend until you update the .env

---

## After Migration

Once verified, update your deployment's environment variables to point to your new Supabase project. The frontend code requires **zero changes** — only the environment variables change.
