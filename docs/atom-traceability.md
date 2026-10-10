# Atom traceability: AI baseline v1

The editable [Figma Atom page](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1708-16) contains 16 `AI v1/` component families and a [review board](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1712-10) made from their instances. This is the preserved AI starting point for a designer-led v2. The existing Guideline page and components were not replaced.

This inventory follows **Storybook titles**, not source directory names. `src/stories/atoms/` also contains Icon, Blockquote, and Select Input files, but their visible Storybook titles place them in Foundations or Molecules. `src/token/tokens.yaml` remains the editable token source. The Figma components reuse existing local color and size variables where available; they do not add tokens.

| Atom | Storybook | Figma v1 component | Website test mapping |
| --- | --- | --- | --- |
| Avatar | [Default](http://storybook.jurenites.local/?path=/story/atoms-avatar--default-story) | [Avatar](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1708-25) | Unmapped |
| Badge | [Numeric](http://storybook.jurenites.local/?path=/story/atoms-badge--numeric-badge) | [Badge](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1708-38) | [Homepage footer](http://test.jurenites.local/#atoms-badge), gray numeric `2` |
| Button | [Default](http://storybook.jurenites.local/?path=/story/atoms-button--default-story) | [Button](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1708-51) | Unmapped |
| Checkbox | [Empty](http://storybook.jurenites.local/?path=/story/atoms-checkbox--empty-state) | [Checkbox](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1709-23) | Unmapped |
| Chip | [Default](http://storybook.jurenites.local/?path=/story/atoms-chip--default-story) | [Chip](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1709-30) | Unmapped |
| Crossfade Dot | [Default](http://storybook.jurenites.local/?path=/story/atoms-crossfade-dot--default-story) | [Crossfade Dot](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1709-35) | Unmapped |
| Date Time Value | [Absolute Date](http://storybook.jurenites.local/?path=/story/atoms-date-time-value--absolute-date) | [Date Time Value](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1709-44) | Unmapped |
| Divider | [Default](http://storybook.jurenites.local/?path=/story/atoms-divider--default-story) | [Divider](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1709-47) | Unmapped |
| Expandable Term | [Default](http://storybook.jurenites.local/?path=/story/atoms-expandable-term--default-story) | [Expandable Term](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1710-7) | Unmapped |
| Horizontal Scrollbar | [Default](http://storybook.jurenites.local/?path=/story/atoms-horizontal-scrollbar--default-story) | [Horizontal Scrollbar](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1710-8) | Unmapped |
| Inline Code | [Default](http://storybook.jurenites.local/?path=/story/atoms-inline-code--default-story) | [Inline Code](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1710-22) | Unmapped |
| Pulse Indicator | [Default](http://storybook.jurenites.local/?path=/story/atoms-pulse-indicator--default-story) | [Pulse Indicator](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1710-29) | Unmapped |
| Surface | [Default](http://storybook.jurenites.local/?path=/story/atoms-surface--default-story) | [Surface](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1710-48) | Unmapped |
| Tooltip | [Default](http://storybook.jurenites.local/?path=/story/atoms-tooltip--default-story) | [Tooltip](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1710-55) | Unmapped |
| Two-tone Heading | [Default](http://storybook.jurenites.local/?path=/story/atoms-two-tone-heading--default-story) | [Two-tone Heading](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1710-68) | Unmapped |
| Version Watermark | [Default](http://storybook.jurenites.local/?path=/story/atoms-version-watermark--default-story) | [Version Watermark](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1710-69) | Unmapped |

## Current validation boundary

The Badge test case in `config/component-status.json` connects the Figma gray numeric variant `1708:32`, Storybook `atoms-badge--numeric-badge` with `color_variant:gray`, and the unique homepage footer selector `.footer-navigation__link--with-badge .badge`. On 2026-10-09, the live Storybook and Drupal elements both rendered `2` at 24×24 with the same gray background and white text. The first exact pixel comparison found **34 differing pixels out of 576**, concentrated in the text glyph. The website badge sits at a fractional page coordinate, which may affect text antialiasing; this is not yet a confirmed cause. A pinned 1× Figma PNG has not been added, so Figma pixel parity remains **missing**. The [Badge dashboard case](http://test.jurenites.local/#atoms-badge) shows the captures and difference image.

The Figma review board is for inspecting families together. It is not a pixel baseline: export each matching variant at 1× with identical content and bounds before using the [visual testing workflow](visual-testing-plan.md). Record the Figma node, Storybook story and args, Drupal route and selector, viewport, state, and source revision for each test case. Keep Figma v1 intact while editing v2 in a separate page or branch so both versions remain reviewable.

Known differences in this first pass:

- Avatar's initials and four sizes are present. The Uploaded photo variant is pending authorization to transfer the personal JPEG from this repository to Figma.
- Figma does not currently have the `4pixel` font available to the connector. The editable Version Watermark uses Ubuntu Sans Mono at the source metrics until that font is available.
- The existing Figma Badge text style predates the current 12px/16px source token. The AI v1 Badge uses the current source dimensions directly; token style synchronization remains separate.
- Pulse motion, native scrollbar behavior, tooltip reveal, and expandable term interaction are represented as static states. Test those behaviors in Storybook and Drupal.
- Date Time Value uses fixed examples in Figma because the Storybook date story derives one value from the current time.
