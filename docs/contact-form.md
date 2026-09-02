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

The CAPTCHA module adds its local math challenge to the standalone Webform ID
`webform_submission_contact_add_form`. It requires no third-party account or
API key. Administrators can inspect submissions under Structure > Webforms >
Contact > Results.

Email transport is environment-owned. The recipe configures the recipient and
message handler, but STAGE and PROD must provide a working Drupal mail transport
before delivery can be considered verified.
