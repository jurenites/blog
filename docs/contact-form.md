# Contact Form

The public `/contact` route is owned by Webform's `contact` configuration entity.
The theme gives its main content block 40px of top padding and hides the
breadcrumb block on Contact, including language-prefixed routes.
Apply the project recipe after installing Composer dependencies:

```bash
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_contact
```

The form contains optional Subject and Who you are fields; Message is required. The
submission is retained in Drupal without automatic purging. An email handler
sends a plain-text notification to Drupal's site email (`system.site:mail`) and
uses the site identity as the sender so visitor-controlled input is not placed
in the mail envelope.

The `make_subject_and_sender_optional` post-update applies these requirements to
existing sites without replacing their other Webform settings or submissions.

Antibot protects the standalone Webform ID
`webform_submission_contact_add_form` without rendering a challenge. Until a
JavaScript-enabled visitor interacts with the loaded page, the form posts to a
dead endpoint. Antibot then restores the real action and injects a form-specific
key that Drupal validates on submission, rejecting simple scripts and direct
remote posts. It requires no third-party account, tracking, or API key.

This deliberately raises the cost of opportunistic spam rather than claiming to
prove that every submitter is human. A browser automation system can still copy
real interactions, so the protection should be revisited if spam becomes a
measurable problem. Administrators can inspect accepted submissions under
Structure > Webforms > Contact > Results.

Email transport is environment-owned. The recipe configures the recipient and
message handler, but STAGE and PROD must provide a working Drupal mail transport
before delivery can be considered verified.

## Gmail SMTP setup

Composer includes `drupal/smtp` (SMTP Authentication Support) and PHPMailer.
Enable `smtp` separately in each environment, then configure
`/admin/config/system/smtp`:

- Server: `smtp.gmail.com`; port: `465`; encryption: SSL (implicit TLS).
- Username and From address: `jurenites@gmail.com`.
- Password: a Google app password created for this environment, not the account
  password. Google requires 2-Step Verification for app passwords.
- Keep SMTP debugging off and plain-text messages enabled for Contact.

DEV has these non-secret settings prepared. A credential-free SMTP connection
over implicit TLS on port 465 succeeded from the DEV container; the STARTTLS
connection on port 587 failed, so DEV uses 465. SMTP remains off until the account
owner enters the app password privately in the local administration form and
switches SMTP on. Enter `jurenites@gmail.com` in the test-email field for the
first save, then clear that field after testing.

Saving the SMTP form with SMTP on sets `system.mail:interface.default` to
`SMTPMailSystem`. Webform's email-provider check automatically removes its
`interface.webform = webform_php_mail` override when SMTP is active, so Webform
inherits the default transport. While SMTP is off, Webform restores its PHP-mail
override. After activation and a cache rebuild, verify Webform resolves to
`SMTPMailSystem`; merely installing the module is not enough.

The administration form stores its password in the environment's Drupal
database. Do not commit configuration exports containing `smtp_password` or
copy DEV credentials to PROD. PROD should use a separate app password, or a
server-local settings override backed by its secret storage. Deploy the locked
Composer dependencies with `composer install`, then enable and configure SMTP
on that environment; installing code alone does not configure delivery.

Verify the SMTP test reaches the inbox, then submit `/contact` and verify both
the stored submission and its notification. A successful TLS connection alone
does not verify authentication or delivery. Inspect Reports > Recent log
messages if either test fails.

Google references: [app passwords](https://support.google.com/mail/answer/185833)
and [Gmail SMTP connection settings](https://developers.google.com/workspace/gmail/imap/imap-smtp).

Contact disables Webform's `form_previous_submissions` reminder. Webform otherwise
recreates this status message on every GET for visitors with previous submissions
and permission to view them; dismissing a toast does not persist across requests.
The install hook and `disable_previous_submission_notice` post-update set the
Contact-specific option to false. Submission history, access rules, limits, and
successful-submission confirmations remain unchanged.
