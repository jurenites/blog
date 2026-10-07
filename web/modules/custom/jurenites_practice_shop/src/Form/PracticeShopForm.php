<?php

namespace Drupal\jurenites_practice_shop\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\jurenites_practice_shop\PracticeShopData;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * A server-rendered sandbox. No payment gateway or address fields exist.
 */
final class PracticeShopForm extends FormBase {

  public function __construct(private readonly PracticeShopData $shopData) {}

  public static function create(ContainerInterface $service_container): static {
    return new static($service_container->get('jurenites_practice_shop.data'));
  }

  public function getFormId(): string {
    return 'jurenites_practice_shop_form';
  }

  private function sessionState(): array {
    return $this->getRequest()->getSession()->get('jurenites_practice_shop', [
      'session_id' => '', 'current_step' => 'catalog', 'cart_items' => [],
    ]);
  }

  private function actionButton(string $button_text, string $action_name, int $product_id = 0): array {
    return [
      '#type' => 'submit', '#value' => $button_text,
      '#name' => $action_name . '_' . $product_id,
      '#shop_action' => $action_name, '#product_id' => $product_id,
      '#attributes' => ['class' => ['button', 'button--primary']],
    ];
  }

  private function creditAmount(int $minor_value): string {
    return (string) $this->t('@amount test credits', ['@amount' => number_format($minor_value / 100, 2)]);
  }

  public function buildForm(array $form, FormStateInterface $form_state): array {
    // Drupal's HTTP argument resolver requires the framework parameter $form.
    $form_output = $form;
    $shop_state = $this->sessionState();
    $product_catalog = $this->shopData->productCatalog();
    $current_step = $shop_state['current_step'];
    $form_output['#attributes']['class'][] = 'practice-shop';
    $form_output['#cache']['max-age'] = 0;
    $form_output['practice_token'] = ['#type' => 'hidden', '#value' => \Drupal::csrfToken()->get('practice-shop')];
    $form_output['shop_heading'] = ['#type' => 'html_tag', '#tag' => 'h1', '#value' => $this->t('Practice shop')];
    $form_output['test_notice'] = ['#type' => 'container', '#attributes' => ['class' => ['practice-shop__notice']],
      'notice_text' => ['#markup' => $this->t('<strong>Practice only.</strong> No payment, real purchase, download, or shipment. All amounts are test credits.')],
    ];
    $form_output['intro_content'] = $this->shopData->introductionContent();
    if (!$shop_state['session_id']) {
      $form_output['session_notice'] = ['#markup' => '<p>' . $this->t('This form uses a temporary session cookie. Starting a practice session records your shop actions under a random session ID for 90 days. No name, email, payment details, or address is requested.') . '</p>'];
      $form_output['start_session'] = $this->actionButton((string) $this->t('Start practice session'), 'start_session');
      return $form_output;
    }

    $form_output['navigation'] = ['#type' => 'container', '#attributes' => ['class' => ['practice-shop__actions']]];
    $form_output['navigation']['catalog_button'] = $this->actionButton((string) $this->t('Browse products'), 'view_catalog');
    $form_output['navigation']['cart_button'] = $this->actionButton((string) $this->t('Cart (@count)', ['@count' => array_sum($shop_state['cart_items'])]), 'view_cart');
    $form_output['navigation']['restart_button'] = $this->actionButton((string) $this->t('End practice session'), 'end_session');

    if ($current_step === 'complete') {
      $order_record = $this->shopData->loadOrder($shop_state['last_order_id'] ?? '', $shop_state['session_id']);
      if ($order_record) {
        $form_output['completion'] = ['#type' => 'container', '#attributes' => ['class' => ['practice-shop__panel'], 'role' => 'status'],
          'heading_text' => ['#type' => 'html_tag', '#tag' => 'h2', '#value' => $this->t('Test order completed')],
          'order_text' => ['#markup' => '<p>' . $this->t('Test order @number. Nothing was charged or dispatched.', ['@number' => $order_record['order_id']]) . '</p>'],
          'total_text' => ['#markup' => '<p>' . $this->t('Simulated total: @amount', ['@amount' => $this->creditAmount((int) $order_record['item_value_minor'] + (int) $order_record['shipping_value_minor'])]) . '</p>'],
        ];
      }
      return $form_output;
    }

    if (in_array($current_step, ['cart', 'checkout'], TRUE)) {
      try {
        $cart_summary = $this->shopData->cartSummary($shop_state['cart_items']);
      }
      catch (\UnexpectedValueException) {
        $form_output['cart_error'] = ['#markup' => '<p>' . $this->t('A product in your cart is no longer available. Clear the cart to continue.') . '</p>'];
        $form_output['clear_cart'] = $this->actionButton((string) $this->t('Clear cart'), 'clear_cart');
        return $form_output;
      }
      $form_output['step_heading'] = ['#type' => 'html_tag', '#tag' => 'h2', '#value' => $current_step === 'checkout' ? $this->t('Review test order') : $this->t('Your practice cart')];
      if (!$cart_summary['product_lines']) {
        $form_output['empty_cart'] = ['#markup' => '<p>' . $this->t('Your cart is empty.') . '</p>'];
        return $form_output;
      }
      foreach ($cart_summary['product_lines'] as $product_line) {
        $product_id = $product_line['product_id'];
        $form_output['line_' . $product_id] = ['#type' => 'container', '#attributes' => ['class' => ['practice-shop__line']],
          'line_text' => ['#markup' => $this->t('@product × @quantity: @amount', ['@product' => $product_line['product_heading'], '@quantity' => $product_line['quantity_value'], '@amount' => $this->creditAmount($product_line['line_value_minor'])])],
        ];
        if ($current_step === 'cart') {
          $form_output['line_' . $product_id]['remove_button'] = $this->actionButton((string) $this->t('Remove @product', ['@product' => $product_line['product_heading']]), 'remove_item', $product_id);
        }
      }
      $form_output['totals_content'] = ['#type' => 'container', '#attributes' => ['class' => ['practice-shop__panel']],
        'items_text' => ['#markup' => '<p>' . $this->t('Products: @amount', ['@amount' => $this->creditAmount($cart_summary['item_value_minor'])]) . '</p>'],
        'shipping_text' => ['#markup' => '<p>' . $this->t('Simulated shipping: @amount', ['@amount' => $this->creditAmount($cart_summary['shipping_value_minor'])]) . '</p>'],
        'total_text' => ['#markup' => '<p><strong>' . $this->t('Total: @amount', ['@amount' => $this->creditAmount($cart_summary['item_value_minor'] + $cart_summary['shipping_value_minor'])]) . '</strong></p>'],
      ];
      if ($current_step === 'checkout') {
        $form_output['checkout_id'] = ['#type' => 'hidden', '#default_value' => $shop_state['checkout_id']];
        $form_output['place_order'] = $this->actionButton((string) $this->t('Place test order · no charge'), 'place_order');
      }
      else {
        $form_output['checkout_button'] = $this->actionButton((string) $this->t('Continue to test checkout'), 'begin_checkout');
      }
      return $form_output;
    }

    $form_output['product_grid'] = ['#type' => 'container', '#attributes' => ['class' => ['practice-shop__products']]];
    foreach ($product_catalog as $product_id => $product_data) {
      if ($current_step === 'product' && $product_id !== ($shop_state['selected_product'] ?? 0)) {
        continue;
      }
      $product_card = ['#type' => 'container', '#attributes' => ['class' => ['practice-shop__product']],
        'kind_text' => ['#type' => 'html_tag', '#tag' => 'p', '#value' => $product_data['product_kind'] === 'digital' ? $this->t('Digital · simulated delivery') : $this->t('Physical · simulated shipping')],
        'heading_text' => ['#type' => 'html_tag', '#tag' => 'h2', '#value' => \Drupal\Component\Utility\Html::escape($product_data['product_heading'])],
        'body_content' => $product_data['body_content'],
        'price_text' => ['#type' => 'html_tag', '#tag' => 'p', '#value' => $this->creditAmount($product_data['price_minor'])],
        'product_actions' => ['#type' => 'container', '#attributes' => ['class' => ['practice-shop__actions']]],
      ];
      if ($current_step === 'catalog') {
        $product_card['product_actions']['view_button'] = $this->actionButton((string) $this->t('View @product', ['@product' => $product_data['product_heading']]), 'view_product', $product_id);
      }
      $product_card['product_actions']['add_button'] = $this->actionButton((string) $this->t('Add @product to cart', ['@product' => $product_data['product_heading']]), 'add_item', $product_id);
      $product_card['product_actions']['add_button']['#disabled'] = ($shop_state['cart_items'][$product_id] ?? 0) >= PracticeShopData::MAX_QUANTITY;
      $form_output['product_grid']['product_' . $product_id] = $product_card;
    }
    if (!$product_catalog) {
      $form_output['no_products'] = ['#markup' => '<p>' . $this->t('No practice products are available.') . '</p>'];
    }
    return $form_output;
  }

  public function validateForm(array &$form_output, FormStateInterface $form_state): void {
    $input_values = $form_state->getUserInput();
    if (!\Drupal::csrfToken()->validate((string) ($input_values['practice_token'] ?? ''), 'practice-shop')) {
      $form_state->setErrorByName('practice_token', $this->t('Your session expired. Reload the page and try again.'));
    }
  }

  public function submitForm(array &$form_output, FormStateInterface $form_state): void {
    $shop_state = $this->sessionState();
    $trigger_button = $form_state->getTriggeringElement();
    $action_name = $trigger_button['#shop_action'] ?? '';
    $product_id = (int) ($trigger_button['#product_id'] ?? 0);
    $product_catalog = $this->shopData->productCatalog();
    if ($action_name === 'end_session') {
      $this->getRequest()->getSession()->remove('jurenites_practice_shop');
      $form_state->setRedirect('jurenites_practice_shop.catalog');
      return;
    }
    if (!$shop_state['session_id']) {
      if ($action_name !== 'start_session') {
        $form_state->setRedirect('jurenites_practice_shop.catalog');
        return;
      }
      $shop_state['session_id'] = $this->shopData->newIdentifier();
      $this->shopData->recordEvent($shop_state['session_id'], 'session_start');
      $this->shopData->recordEvent($shop_state['session_id'], 'view_item_list');
    }
    try {
      switch ($action_name) {
        case 'view_catalog':
          $shop_state['current_step'] = 'catalog';
          $this->shopData->recordEvent($shop_state['session_id'], 'view_item_list');
          break;

        case 'view_product':
        case 'add_item':
          if (!isset($product_catalog[$product_id])) {
            throw new \UnexpectedValueException('This product is no longer available.');
          }
          if ($action_name === 'view_product') {
            $shop_state['current_step'] = 'product';
            $shop_state['selected_product'] = $product_id;
            $this->shopData->recordEvent($shop_state['session_id'], 'view_item', ['product_id' => $product_id]);
          }
          else {
            if (($shop_state['cart_items'][$product_id] ?? 0) >= PracticeShopData::MAX_QUANTITY) {
              throw new \UnexpectedValueException('The cart quantity limit has been reached.');
            }
            $shop_state['cart_items'][$product_id] = ($shop_state['cart_items'][$product_id] ?? 0) + 1;
            $this->shopData->recordEvent($shop_state['session_id'], 'add_to_cart', ['product_id' => $product_id, 'quantity_value' => 1, 'item_value_minor' => $product_catalog[$product_id]['price_minor']]);
            $this->messenger()->addStatus($this->t('Added @product to your practice cart.', ['@product' => $product_catalog[$product_id]['product_heading']]));
          }
          break;

        case 'remove_item':
          if (isset($shop_state['cart_items'][$product_id])) {
            $this->shopData->recordEvent($shop_state['session_id'], 'remove_from_cart', ['product_id' => $product_id, 'quantity_value' => $shop_state['cart_items'][$product_id]]);
            unset($shop_state['cart_items'][$product_id]);
          }
          $shop_state['current_step'] = 'cart';
          break;

        case 'clear_cart':
          foreach ($shop_state['cart_items'] as $removed_id => $quantity_value) {
            $this->shopData->recordEvent($shop_state['session_id'], 'remove_from_cart', ['product_id' => $removed_id, 'quantity_value' => $quantity_value]);
          }
          $shop_state['cart_items'] = [];
          $shop_state['current_step'] = 'cart';
          break;

        case 'view_cart':
          $shop_state['current_step'] = 'cart';
          $this->shopData->recordEvent($shop_state['session_id'], 'view_cart');
          break;

        case 'begin_checkout':
          $cart_summary = $this->shopData->cartSummary($shop_state['cart_items']);
          if (!$cart_summary['product_lines']) {
            throw new \UnexpectedValueException('The cart is empty.');
          }
          $shop_state['checkout_id'] = $this->shopData->newIdentifier();
          $shop_state['quote_signature'] = $this->shopData->quoteSignature($cart_summary);
          $shop_state['current_step'] = 'checkout';
          $this->shopData->recordEvent($shop_state['session_id'], 'begin_checkout', array_diff_key($cart_summary, ['product_lines' => TRUE]));
          break;

        case 'place_order':
          if ($shop_state['current_step'] !== 'checkout' || ($form_state->getUserInput()['checkout_id'] ?? '') !== ($shop_state['checkout_id'] ?? NULL)) {
            throw new \UnexpectedValueException('This checkout has expired.');
          }
          $order_record = $this->shopData->completeOrder($shop_state['checkout_id'], $shop_state['session_id'], $shop_state['cart_items'], $shop_state['quote_signature'] ?? '');
          $shop_state['last_order_id'] = $order_record['order_id'];
          $shop_state['cart_items'] = [];
          $shop_state['current_step'] = 'complete';
          unset($shop_state['checkout_id']);
          break;
      }
    }
    catch (\UnexpectedValueException) {
      $this->messenger()->addWarning($this->t('Your cart or checkout changed. Please review the cart before continuing.'));
      $shop_state['current_step'] = 'cart';
    }
    $this->getRequest()->getSession()->set('jurenites_practice_shop', $shop_state);
    $form_state->setRedirect('jurenites_practice_shop.catalog');
  }

}
