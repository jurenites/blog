<?php

namespace Drupal\jurenites_dynamic_thumbnail;

/** Strict passive SVG subset. Never insert an uploaded document verbatim. */
final class ThumbnailSvg {

  public const UPLOAD_HELP = 'Optional SVG with any positive viewBox size. Name depth groups level_0, level_1, level_2 and onward; missing levels are allowed. Use a _horizontal suffix for horizontal-only photo movement. Export from Figma with Include id attribute and Outline text enabled. Flattened exports move as one foreground layer; a full-frame radial background is detected automatically. Replaces the preview image only. Clear to use the ordinary Image field.';

  public static function prepare(string $svg_source, string $id_prefix): ?string {
    if (strlen($svg_source) > 5 * 1024 * 1024 || preg_match('/<!DOCTYPE|<!ENTITY/i', $svg_source)) {
      return NULL;
    }
    $svg_document = new \DOMDocument();
    $previous_errors = libxml_use_internal_errors(TRUE);
    $parse_success = $svg_document->loadXML($svg_source, LIBXML_NONET);
    libxml_clear_errors();
    libxml_use_internal_errors($previous_errors);
    if (!$parse_success || $svg_document->documentElement->localName !== 'svg') {
      return NULL;
    }
    $allowed_elements = ['svg', 'g', 'defs', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'mask', 'clipPath', 'linearGradient', 'radialGradient', 'stop', 'pattern', 'image', 'use', 'filter', 'feFlood', 'feColorMatrix', 'feOffset', 'feGaussianBlur', 'feBlend', 'feComposite', 'title', 'desc'];
    $allowed_attributes = explode(' ', 'id class viewBox preserveAspectRatio x y x1 y1 x2 y2 width height cx cy fx fy r rx ry d points fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset stroke-opacity opacity transform clip-path clip-rule mask maskUnits maskContentUnits gradientUnits gradientTransform spreadMethod offset stop-color stop-opacity patternUnits patternContentUnits patternTransform filter filterUnits primitiveUnits color-interpolation-filters flood-color flood-opacity in in2 result type values dx dy stdDeviation mode operator k1 k2 k3 k4 href');
    $svg_elements = iterator_to_array($svg_document->getElementsByTagName('*'));
    $element_ids = [];
    $has_depth_layers = FALSE;
    $has_background_highlight = FALSE;
    foreach ($svg_elements as $svg_element) {
      if (!in_array($svg_element->localName, $allowed_elements, TRUE) || $svg_element->namespaceURI !== 'http://www.w3.org/2000/svg') {
        return NULL;
      }
      foreach (iterator_to_array($svg_element->attributes) as $svg_attribute) {
        $attribute_name = $svg_attribute->localName;
        $attribute_value = $svg_attribute->value;
        if (!in_array($attribute_name, $allowed_attributes, TRUE)) {
          return NULL;
        }
        if ($attribute_name === 'href' && !preg_match('~^(#[^<>]+|data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+)$~D', $attribute_value)) {
          return NULL;
        }
        if (preg_match('/url\s*\(/i', $attribute_value) && !preg_match('/^url\(#[^()]+\)$/D', $attribute_value)) {
          return NULL;
        }
        if (preg_match('/[<>\\\\]|javascript:|expression\s*\(/i', $attribute_value)) {
          return NULL;
        }
      }
      if ($svg_element->hasAttribute('id')) {
        $original_id = $svg_element->getAttribute('id');
        if ($original_id === '' || preg_match('/[\x00-\x1F]/', $original_id) || isset($element_ids[$original_id])) return NULL;
        $element_ids[$original_id] = $id_prefix . '-element-' . count($element_ids);
        if (preg_match('/^level_([0-9]+)(?:_[\w-]+)?$/D', $original_id, $layer_match)) {
          $svg_element->setAttribute('data-thumbnail-depth', $layer_match[1]);
          $has_depth_layers = TRUE;
          if (preg_match('/_horizontal(?:_|$)/', $original_id)) {
            $svg_element->setAttribute('class', trim($svg_element->getAttribute('class') . ' dynamic-thumbnail__layer--horizontal'));
          }
        }
        if ($original_id === 'background_highlight' && $svg_element->localName === 'radialGradient') {
          $svg_element->setAttribute('data-thumbnail-highlight', '');
          $has_background_highlight = TRUE;
        }
      }
    }
    $view_box = preg_split('/[\s,]+/', trim($svg_document->documentElement->getAttribute('viewBox')));
    if (count($view_box) !== 4 || count(array_filter($view_box, 'is_numeric')) !== 4) return NULL;
    [$frame_x, $frame_y, $frame_width, $frame_height] = array_map('floatval', $view_box);
    if (!is_finite($frame_x) || !is_finite($frame_y) || !is_finite($frame_width) || !is_finite($frame_height) || $frame_width <= 0 || $frame_height <= 0) return NULL;
    // Figma may flatten named groups. Keep the composition intact and use one
    // foreground depth rather than inventing separate depths from path order.
    $artwork_parent = $svg_document->documentElement;
    $painted_children = static function (\DOMElement $parent_element): array {
      return array_values(array_filter(iterator_to_array($parent_element->childNodes), static fn ($child_node) =>
        $child_node instanceof \DOMElement && !in_array($child_node->localName, ['defs', 'title', 'desc', 'mask', 'clipPath', 'filter', 'linearGradient', 'radialGradient', 'pattern'], TRUE)
      ));
    };
    $artwork_children = $painted_children($artwork_parent);
    while (count($artwork_children) === 1 && $artwork_children[0]->localName === 'g' && !$artwork_children[0]->hasAttribute('transform') && !$artwork_children[0]->hasAttribute('data-thumbnail-depth')) {
      $artwork_parent = $artwork_children[0];
      $artwork_children = $painted_children($artwork_parent);
    }
    $background_shape = $artwork_children[0] ?? NULL;
    if ($background_shape && $background_shape->getAttribute('id') === 'background' && $background_shape->localName === 'g' && !$background_shape->hasAttribute('transform')) {
      $background_children = $painted_children($background_shape);
      if (count($background_children) === 1) $background_shape = $background_children[0];
    }
    $has_background_rect = $background_shape && $background_shape->localName === 'rect'
      && !$background_shape->hasAttribute('transform')
      && !$background_shape->hasAttribute('data-thumbnail-depth')
      && (float) $background_shape->getAttribute('x') <= $frame_x
      && (float) $background_shape->getAttribute('y') <= $frame_y
      && (float) $background_shape->getAttribute('x') + (float) $background_shape->getAttribute('width') >= $frame_x + $frame_width
      && (float) $background_shape->getAttribute('y') + (float) $background_shape->getAttribute('height') >= $frame_y + $frame_height;
    if (!$has_background_highlight && $has_background_rect && preg_match('/^url\(#([^()]+)\)$/D', $background_shape->getAttribute('fill'), $gradient_match)) {
      foreach ($svg_elements as $gradient_candidate) {
        if ($gradient_candidate->localName !== 'radialGradient' || $gradient_candidate->getAttribute('id') !== $gradient_match[1]) continue;
        // Clone so a shared gradient elsewhere in the artwork stays unchanged.
        $gradient_copy = $gradient_candidate->cloneNode(TRUE);
        $gradient_id = 'thumbnail_auto_highlight';
        while (isset($element_ids[$gradient_id])) $gradient_id .= '_copy';
        $gradient_copy->setAttribute('id', $gradient_id);
        $gradient_copy->setAttribute('data-thumbnail-highlight', '');
        foreach ($gradient_copy->getElementsByTagName('*') as $gradient_child) $gradient_child->removeAttribute('id');
        $gradient_candidate->parentNode->appendChild($gradient_copy);
        $element_ids[$gradient_id] = $id_prefix . '-' . $gradient_id;
        $background_shape->setAttribute('fill', 'url(#' . $gradient_id . ')');
        break;
      }
    }
    if (!$has_depth_layers) {
      $foreground_group = $svg_document->createElementNS('http://www.w3.org/2000/svg', 'g');
      $foreground_group->setAttribute('data-thumbnail-depth', '1');
      foreach ($artwork_children as $artwork_child) {
        if ($has_background_rect && ($artwork_child === $background_shape || $background_shape->parentNode === $artwork_child)) continue;
        if (!$foreground_group->parentNode) $artwork_parent->insertBefore($foreground_group, $artwork_child);
        $foreground_group->appendChild($artwork_child);
      }
    }
    $svg_elements = iterator_to_array($svg_document->getElementsByTagName('*'));
    foreach ($svg_elements as $svg_element) {
      foreach ($svg_element->attributes as $svg_attribute) {
        if ($svg_attribute->localName === 'id') {
          $svg_attribute->value = $element_ids[$svg_attribute->value];
        }
        elseif (preg_match('/^url\(#([^()]+)\)$/D', $svg_attribute->value, $reference_match)) {
          if (!isset($element_ids[$reference_match[1]])) return NULL;
          $svg_attribute->value = 'url(#' . $element_ids[$reference_match[1]] . ')';
        }
        elseif ($svg_attribute->localName === 'href' && str_starts_with($svg_attribute->value, '#')) {
          $reference_id = substr($svg_attribute->value, 1);
          if (!isset($element_ids[$reference_id])) return NULL;
          $svg_attribute->value = '#' . $element_ids[$reference_id];
        }
      }
    }
    // Animate an outer group so exported positions, rotations and masks survive.
    foreach ($svg_elements as $svg_element) {
      if (!$svg_element->hasAttribute('data-thumbnail-depth') || $svg_element === $svg_document->documentElement) continue;
      $motion_group = $svg_document->createElementNS('http://www.w3.org/2000/svg', 'g');
      $motion_group->setAttribute('data-thumbnail-depth', $svg_element->getAttribute('data-thumbnail-depth'));
      $svg_element->removeAttribute('data-thumbnail-depth');
      if (str_contains($svg_element->getAttribute('class'), 'dynamic-thumbnail__layer--horizontal')) {
        $motion_group->setAttribute('class', 'dynamic-thumbnail__layer--horizontal');
        $svg_element->setAttribute('class', trim(str_replace('dynamic-thumbnail__layer--horizontal', '', $svg_element->getAttribute('class'))));
      }
      $svg_element->parentNode->insertBefore($motion_group, $svg_element);
      $motion_group->appendChild($svg_element);
    }
    $root_element = $svg_document->documentElement;
    $root_element->removeAttribute('width');
    $root_element->removeAttribute('height');
    $root_element->setAttribute('class', 'dynamic-thumbnail__artwork');
    $root_element->setAttribute('aria-hidden', 'true');
    $root_element->setAttribute('focusable', 'false');
    return $svg_document->saveXML($root_element);
  }
}
