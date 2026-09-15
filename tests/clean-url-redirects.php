<?php

/**
 * @file
 * Local HTTP check: drush php:script tests/clean-url-redirects.php.
 */

$request_cases = [
  ['GET', '/node/4', 301, '/about'],
  ['HEAD', '/node/4', 301, '/about'],
  ['GET', '/ru/node/4', 301, '/ru/obo'],
  ['GET', '/node/4?utm_source=redirect-check&example=a%20b', 301, '/about?utm_source=redirect-check&example=a%20b'],
  ['GET', '/about', 200, NULL],
  ['GET', '/ru/obo', 200, NULL],
  ['GET', '/', 200, NULL],
  ['GET', '/ru', 200, NULL],
  ['GET', '/user/login', 200, NULL],
  ['GET', '/node/4/edit', 403, NULL],
  ['POST', '/node/4', 200, NULL],
];

foreach ($request_cases as [$http_method, $request_path, $expected_status, $expected_location]) {
  $page_response = \Drupal::httpClient()->request($http_method, 'http://127.0.0.1' . $request_path, [
    'headers' => ['Host' => 'jurenites.local'],
    'allow_redirects' => FALSE,
    'http_errors' => FALSE,
  ]);
  $actual_location = $page_response->getHeaderLine('Location');
  $expected_url = $expected_location === NULL ? '' : 'http://jurenites.local' . $expected_location;
  if ($page_response->getStatusCode() !== $expected_status || $actual_location !== $expected_url) {
    throw new RuntimeException(sprintf(
      '%s %s: expected %d %s; received %d %s.',
      $http_method, $request_path, $expected_status, $expected_url,
      $page_response->getStatusCode(), $actual_location,
    ));
  }
  echo "$http_method $request_path: $expected_status $actual_location\n";
}
