<?php

/**
 * Read-only HTTP smoke test. Run in the local Drupal web container.
 */
$http_context = stream_context_create(['http' => [
  'header' => "Host: jurenites.local\r\n",
  'ignore_errors' => TRUE,
]]);
$page_html = file_get_contents('http://127.0.0.1/qr-studio', FALSE, $http_context);
if (!str_contains($http_response_header[0] ?? '', '200')) {
  throw new RuntimeException('QR Studio route did not return HTTP 200: ' . ($http_response_header[0] ?? 'no response'));
}
$page_document = new DOMDocument();
@$page_document->loadHTML($page_html);
$page_xpath = new DOMXPath($page_document);
if ($page_xpath->query('//*[@id="address-pattern"]')->length !== 1 || $page_xpath->query('//*[@id="qr-canvas"]')->length !== 1) {
  throw new RuntimeException('The studio input or canvas is missing.');
}
if (str_contains($page_html, '-placeholder token=') || str_contains($page_html, 'jurenites_theme/css/style.min.css')) {
  throw new RuntimeException('Attachments are unresolved or blog styles leaked into the studio.');
}
$module_prefix = '/modules/custom/jurenites_qr_studio/ui/';
$asset_paths = [];
foreach ($page_xpath->query('//script[@src] | //link[@rel="stylesheet"]') as $asset_element) {
  $asset_path = $asset_element->getAttribute($asset_element->nodeName === 'script' ? 'src' : 'href');
  $asset_paths[] = $asset_path;
  if (!str_starts_with($asset_path, $module_prefix)) {
    throw new RuntimeException('Unexpected studio asset: ' . $asset_path);
  }
  if (str_contains($asset_path, '/app.js') && $asset_element->getAttribute('type') !== 'module') {
    throw new RuntimeException('Studio entry point is not an ES module.');
  }
}
foreach (['search-worker.js', 'core.js', 'solver.js', 'character-map.js', 'editor-tools.js', 'imports.js', 'matches.js', 'logo.json', 'domain-pattern.js', 'tld-data.js'] as $asset_name) {
  $asset_paths[] = $module_prefix . $asset_name;
}
foreach ($asset_paths as $asset_path) {
  $asset_body = file_get_contents('http://127.0.0.1' . $asset_path, FALSE, $http_context);
  if (!str_contains($http_response_header[0] ?? '', '200') || !$asset_body) {
    throw new RuntimeException('Cannot load asset: ' . $asset_path);
  }
}
echo 'QR Studio route and ' . count($asset_paths) . " assets returned HTTP 200; module script, isolated styles, input and canvas verified.\n";
