## 1. Drupal filtering and content update

- [x] 1.1 Add the Project module's explicit tag-resolver dependency and extend the Portfolio View with the readable shared-tag argument; verify valid, invalid, and absent tag query values produce the specified result sets.
- [x] 1.2 Add an idempotent install/update helper and recipe content for the stable Font term, append it to Roundabout and 4pixel without replacing other tags, and ensure the Fonts footer menu link; verify rerunning the helper creates no duplicates.

## 2. Shared presentation contracts

- [x] 2.1 Generalize tag-field preprocessing so Project tags link to filtered Portfolio while Article tags retain Blog/Video routing; verify rendered card and detail links for both bundles.
- [x] 2.2 Expose the selected Portfolio tag and clear action through the existing filtered-list presentation; verify the active label and clear URL in rendered Portfolio output.
- [x] 2.3 Add the access-checked published Project count with node, taxonomy, and access cache metadata, then compose the existing gray Badge in the Drupal footer; verify the rendered number matches the current query and changes after a Project is published, unpublished, tagged, or untagged.
- [x] 2.4 Extend Footer Navigation's shared markup helper and story by composing the Badge atom; verify Storybook demonstrates the Fonts link without duplicating Badge HTML.
- [x] 2.5 Replace the Portfolio selected-tag summary with a persistent access-aware Chip list built from published Project tags, mark the active Chip without a close icon, and verify selecting, switching, and clearing through the Chip links in DEV and Storybook.
- [x] 2.6 Derive main-navigation active styling from Drupal's route active trail so Portfolio stays current on tag-filtered URLs, and verify the filtered and unfiltered menu DOM and computed styles in DEV.

## 3. Delivery verification

- [x] 3.1 Add focused automated coverage for slug filtering, idempotent term assignment, context-aware tag URLs, and count/cache behavior; verify the new test suite passes.
- [x] 3.2 Apply the update in DEV, clear caches, and verify anonymous `/portfolio`, the Font-filtered listing, Project tag links, Article tag links, and the dynamic footer count through served HTML and browser checks.
- [x] 3.3 Update the relevant content-model and component documentation, advance the documentation checkpoint for this delivered iteration, and verify lint, documentation, theme, and Storybook production checks pass.
