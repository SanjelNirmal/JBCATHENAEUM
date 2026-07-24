# Academic Posts CMS

## Architecture

Academic posts, campus news, notices, and Google Drive resource posts share one
CMS. Public pages read only currently published rows. The admin application uses
the existing `user_roles`, AAL2, `has_role`, `audit_events`, `programs`, and
Supabase client patterns.

Post bodies are stored as Markdown and rendered as React elements. Executable
HTML is never rendered. Cover images use the private
`academic-post-covers` bucket and short-lived signed URLs.

## Database setup

Apply:

```text
supabase/migrations/202607240019_academic_posts_cms.sql
```

The linked project's migration history currently reports older repository
migrations as pending even though production objects may have been installed
through the SQL Editor. Do not run an unreviewed `supabase db push` that includes
all reported migrations. Apply the new CMS migration in the Supabase SQL Editor,
or repair migration history before using the CLI.

The migration is idempotent and creates:

- `academic_post_status`
- `academic_post_categories`
- `academic_posts`
- `academic_post_events`
- RLS policies and grants
- protected publication, archive, feature, view, share, and Drive-event RPCs
- the private `academic-post-covers` Storage bucket and policies
- default categories

If `pg_cron` is enabled, the migration schedules
`publish_due_academic_posts()` every minute. Public queries also call this
idempotent function before reading posts, so due posts recover even when cron is
not available.

## Optional development data

Run `supabase/seeds/academic_posts_development.sql` only when sample content is
wanted. It is idempotent and deliberately stores `NULL` Drive URLs.

## Deployment

No new frontend environment variables are required. The existing variables
remain:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

After applying the migration:

```bash
npm run build
```

Push the application branch to the configured Cloudflare Pages production
branch. The existing `npm run build` command and `dist` output remain valid.

## Verification

1. Open `/posts` while signed out. Only published, non-deleted, non-future posts
   should appear.
2. Confirm a draft, archived post, and future scheduled post return the public
   not-found state at `/posts/:slug`.
3. Sign in with a permitted role and AAL2, then open `/admin/posts`.
4. Create a draft and confirm it is absent publicly.
5. Publish it and confirm the archive and detail pages display it.
6. Schedule a future post and confirm it remains private until due.
7. Feature a published post and confirm the previous primary feature is
   unfeatured.
8. Upload, replace, and remove JPEG, PNG, and WebP covers; reject files over
   5 MB or with another MIME type.
9. Confirm posts without a Drive URL do not render Drive controls.
10. Archive and restore a post. Confirm only a super administrator sees the
    soft-delete action.
11. Test `/posts`, `/posts/:slug`, `/admin/posts`, and the editor at desktop,
    tablet, and mobile widths.
