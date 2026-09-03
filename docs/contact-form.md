# Contact Form

The public `/contact` route is owned by Webform's `contact` configuration entity.
Apply the project recipe after installing Composer dependencies:

```bash
docker exec blog_jurenites_web ./vendor/bin/drush recipe /opt/drupal/recipes/jurenites_contact
```

The form contains three required fields: Subject, Who you are, and Message. The
submission is retained in Drupal without automatic purging. An email handler
sends a plain-text notification to Drupal's site email (`system.site:mail`) and
uses the site identity as the sender so visitor-controlled input is not placed
in the mail envelope.

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
