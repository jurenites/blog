<?php

namespace Drupal\jurenites_dream_desires;

use Drupal\Core\Access\AccessResult;
use Drupal\Core\Entity\EntityAccessControlHandler;
use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Session\AccountInterface;

/** Generic entity access is admin-only; mobile access is checked by the API. */
final class PrivateEntityAccess extends EntityAccessControlHandler {
  protected function checkAccess(EntityInterface $entity_object, $operation_name, AccountInterface $account_user) {
    return AccessResult::allowedIfHasPermission($account_user, 'administer dream desires');
  }
  protected function checkCreateAccess(AccountInterface $account_user, array $context_values, $bundle_name = NULL) {
    return AccessResult::allowedIfHasPermission($account_user, 'administer dream desires');
  }
}
