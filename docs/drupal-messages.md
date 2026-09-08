# Drupal message toasts

`jurenites_theme` displays Drupal status, warning, and error messages as a fixed
stack below the frontend header. Status messages dismiss after 6 seconds and
warnings after 10 seconds; errors remain until manually dismissed or navigation.
Hovering a toast or focusing anything inside it pauses its timer. The remaining
time resumes only after both hover and keyboard focus leave. The stack fits narrow screens and scrolls when messages exceed
its available height. Type headings and green, amber, or red borders distinguish
messages without relying on color alone.

The global library attaches `core/drupal.message`. A theme override of
`Drupal.theme.message` handles JavaScript and core AJAX message commands;
`templates/misc/status-messages.html.twig` handles PHP messenger output. Both
preserve message HTML and links, use status/alert accessibility roles, and offer
translated dismiss buttons. Drupal retains ownership of announcements, message
IDs, and its add/select/remove/clear API. Keyboard dismissal moves focus to the
next toast, the previous toast, or the main content when the last toast closes.
Without JavaScript, server messages remain readable and dismiss buttons hide.

Styles live in `src/slice/src/scss/molecules/_message-toast.scss`; dimensions and
layer values come from `component.message-toast` tokens. The runtime Drupal
`--drupal-displace-offset-top` variable accounts for toolbar displacement. The
Storybook **Molecules / Message Toast** examples reuse the actual JS renderer
and dismissal behavior for all three message types.

Timer regression checks: `node --test tests/message-toast.test.mjs`. These cover
expiry durations, overlapping hover/focus pauses, remaining-time resumption,
and repeated Drupal behavior attachment. Local browser verification confirmed
that a hovered status survives while a warning expires, then disappears after
the pointer leaves; errors remain visible.

## Repeatable browser test

1. Reload `http://jurenites.local/` to load the updated theme assets.
2. Copy the test with this terminal command:

   ```sh
   pbcopy < /Users/alexanderilivanov/Projects/blog_jurenites/scripts/test-drupal-messages.js
   ```

3. Paste it into the browser developer-tools Console and press Enter.
4. Inspect **TEST 1/3 status**, **TEST 2/3 warning**, **TEST 3/3 error**.
5. Dismiss one using its × button, or focus that button and press Enter.
6. Hover a status toast for longer than 6 seconds: it stays visible. Move away
   and it dismisses after its remaining time. Keyboard focus pauses it too.
7. Run the script again: three test messages return in the same order.
   Reload the page to clear the temporary test messages.

The script replaces only its own test messages. It does not save content or
change configuration. Its console table reports each toast as `relative`; the
containing message region is `fixed`. On older pages it can load missing core
scripts, but a reload is necessary to pick up the theme's toast implementation.

The server rendering test runs independently of a browser session:

```sh
docker exec blog_jurenites_web vendor/bin/drush php:script tests/drupal-message-toasts.php
```

It checks the real messenger/render pipeline for four individual toasts,
including two status messages, alert roles, translated dismiss labels, preserved
links, and consumption of the message queue. Browser checks cover desktop and
390px mobile display, repeated insertion, and keyboard dismissal. A complete
form submission and redirect is not part of this visual test.

## Requesting messages from application code

For server-rendered messages, use Drupal's messenger service in a module's form
submit handler or controller (prefer dependency injection in application code):

```php
$message_service = \Drupal::messenger();
$message_service->addStatus(t('The operation completed.'));
$message_service->addWarning(t('Please check the result.'));
$message_service->addError(t('The operation failed.'));
```

These are delivered through the visitor's session and the Status messages block.
Running messenger calls in Drush does not queue messages for a browser session.
Avoid putting message creation in theme preprocess hooks: those run during
rendering and are affected by caching.

The theme already attaches `core/drupal.message`. Frontend JavaScript can call `new Drupal.Message().add('Message text',
{ type: 'status' })`. Valid core types are `status`, `warning`, and `error`.
The console test exercises that JS rendering path; it does not verify PHP
messenger delivery across a redirect.
