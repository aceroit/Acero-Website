# Email workflow and SMTP configuration

## How email sending works

**Triggers:** Workflow notifications (submit, review, approve, reject, etc.), enquiry submission, and application submission.

**Flow:** A controller or service calls the notification service → the service loads SMTP config (DB first, then env) → creates or reuses a transporter → sends via nodemailer.

## Where SMTP settings come from

- **Primary:** Admin → Website Configuration → SMTP. Create or edit an SMTP record, set Host, Port, Secure, Username, Password, From Email, From Name. Submit for review, approve, publish, and set **Featured**. Only the **published + featured** record is used (`SMTPSettings.getPublished()`).
- **Fallback:** Env vars `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_FROM_NAME` are used when no published SMTP config exists or required fields are missing.

## What to configure in Admin (and how the backend uses it)

| Admin field   | Backend field     | Use                                                                 |
|---------------|-------------------|---------------------------------------------------------------------|
| Host          | `host.value`      | SMTP server host                                                    |
| Port          | `port.value`      | SMTP port                                                           |
| Secure        | `secure.value`    | Use TLS/SSL                                                         |
| Username      | `username.value`  | SMTP auth username                                                  |
| Password      | `password.value`  | SMTP auth password                                                  |
| From Email    | `fromEmail.value` | “From” address in outgoing emails                                   |
| From Name     | `fromName.value`  | “From” display name                                                 |

The record must be **Published** and **Featured** for it to be used. The backend reads it via `SMTPSettings.getPublished()` when sending.

## How you get those values

- **From Admin:** After saving and publishing an SMTP config (and marking it Featured), those values are stored in the DB. The backend uses them when sending (via `SMTPSettings.getPublished()`). Published SMTP config is cached in memory for 60 seconds to limit DB reads.
- **From env:** Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_FROM_NAME` in `.env` and restart the server. They are used when no published DB config is available or when required fields are missing.
- **Security:** Passwords and secrets stay in DB or env only, never in frontend or public APIs.

## Testing

Trigger an enquiry or application from the frontend and confirm the recipient gets the email. Alternatively, use workflow actions (e.g. submit for review) to trigger notification emails. The “From” address and server used will match the published SMTP config when one exists, otherwise the env-based fallback.
