# JBC Athenaeum email templates

Use these templates when sending personal emails to users, contributors, reviewers, or campus contacts.

## Files

- `docs/email-templates/jbc-athenaeum-personal-email.html` — branded HTML email template with inline email-safe styling.
- `docs/email-templates/jbc-athenaeum-personal-email.txt` — plain-text fallback for mail clients that do not support HTML.

## Branding

- Logo: `https://jbc.nirmalsanjel.com.np/logo.png`
- Primary navy: `#001b3a`
- Secondary navy: `#002147`
- Gold: `#c49b63`
- Light gold: `#d8b37a`
- Page background: `#f4f7fb`

## Replace these placeholders

| Placeholder | Use for |
| --- | --- |
| `{{email_title}}` | Browser/email document title. Usually same as the subject. |
| `{{preheader_text}}` | Short preview text shown beside the subject in inboxes. |
| `{{recipient_name}}` | Receiver name, for example `Nirmal`. |
| `{{subject_title}}` | Main heading inside the email. |
| `{{message_body}}` | Main email message. Use short paragraphs. |
| `{{primary_button_url}}` | Main action link. |
| `{{primary_button_label}}` | Button text, for example `Open JBC Athenaeum`. |
| `{{note_text}}` | Optional note, deadline, or explanation. |
| `{{sender_name}}` | Sender name. |
| `{{sender_title}}` | Sender role/title. |
| `{{sender_email}}` | Reply/contact email. |

## How to use in personal email

1. Open the HTML template.
2. Replace every `{{placeholder}}`.
3. Preview it in a browser.
4. Copy the rendered email into your mail composer, or use an email client/tool that supports HTML email source.
5. Send a test email to yourself before sending to users.

If your mail app does not support HTML paste/source, use the `.txt` version.

## Example subject lines

- Your JBC Athenaeum resource update
- Your uploaded PDF is under review
- JBC Athenaeum account notice
- Jana Bhawana Campus resource archive update

## Notes

- Keep personal emails short and specific.
- Do not include passwords, private tokens, or confidential student data.
- Keep the logo URL absolute so email clients can load it outside the website.
- If no button is needed, remove the button block from the HTML template and remove the action link from the text template.
