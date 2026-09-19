<?php
$checkbox_fixture = [
  '#type' => 'checkbox',
  '#id' => 'checkbox-fixture',
  '#title' => 'Drupal checkbox label',
  '#name' => 'checkbox_fixture',
  '#return_value' => 'yes',
  '#attributes' => ['data-checkbox-state' => 'partially'],
];
echo \Drupal::service('renderer')->renderRoot($checkbox_fixture);
