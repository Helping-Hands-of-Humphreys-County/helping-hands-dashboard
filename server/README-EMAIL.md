Email / Invite setup
=====================

By default the server will not send outbound email. In development the API returns invite/reset tokens in responses so you can copy them.

To enable real email sending set SMTP configuration in `appsettings.Development.json` or as environment variables. Example keys:

- `Smtp:Host` (required to enable SMTP sender)
- `Smtp:Port` (default: 25)
- `Smtp:Username` (optional)
- `Smtp:Password` (optional)
- `Smtp:From` (default: no-reply@example.com)
- `Smtp:EnableSsl` (true/false, default true)
- `Frontend:BaseUrl` (URL to your frontend, default http://localhost:5173)

Example `appsettings.Development.json` (copy from `appsettings.Development.json.sample`):

{
  "Smtp": { ... },
  "Frontend": { "BaseUrl": "http://localhost:5173" }
}

When SMTP is configured the server will send an invite email after creating a user without a password. In production you should not return invite tokens in API responses; our dev behavior still returns the token for convenience.
