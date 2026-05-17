# JBC ATHENAEUM (PHP + HTML + Pure CSS)

This website is now implemented using:
- PHP (server-side rendering and routing)
- Semantic HTML
- Pure CSS (no CSS framework)

## Run locally

### Option 1: PHP built-in server

```bash
php -S 127.0.0.1:8000 -t /home/runner/work/test-website/test-website
```

Open: `http://127.0.0.1:8000/index.php`

### Option 2: Apache/Nginx + PHP

Serve the repository root and ensure PHP is enabled.

## Admin login

Set environment variables before starting PHP:

```bash
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="your-password"
```

Then open `/index.php?view=admin`.

## Structure

- `/index.php` — front controller and page rendering
- `/includes/data.php` — subjects, notes, and info page content
- `/assets/styles.css` — all website styles
