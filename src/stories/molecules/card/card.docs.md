## Using the phone preview in a Project

This component is structured HTML with a phone case, a screen container and an ordered sequence of media frames. The theme supplies its styles and interaction code. It is not a standalone video tag or an HTML shortcode.

### Protected rich text editing

Wrap complete phone markup in `<div data-phone-preview>...</div>` before placing it in a Project story. The existing ScatchApp `data-scatchapp-sequence` wrapper is also supported.

The `jurenites_admin` PhonePreview CKEditor plugin loads wherever Source editing is enabled. It treats the wrapper as one selectable block and preserves its internal HTML through loading, source-mode toggles and node saves. The visual editor shows a labeled placeholder instead of interpreting the nested phone artwork and video spans. You can move or remove the whole block and edit the surrounding prose normally.

Use Source for deliberate changes to the card HTML. Keep the wrapper and required nesting intact; source edits can still intentionally change or remove the preview. Bare card markup without either supported wrapper is not protected. Existing malformed markup must be repaired once before this protection can preserve it.

### Required nesting

This is a structural example, not the complete phone artwork. Use the complete example below when inspecting or restoring the generated component through a controlled content update.

```html
<a class="card card--native-screen card--transparent card--compact-screen card--modern"
   href="/path/to/original-recording.mp4"
   aria-label="Open the recording"
   data-cursor-card
   data-follow-cursor="true">
  <span class="card__phone card__phone--compact-screen card__phone--modern"
        data-card-phone>
    <!-- Keep the generated phone case SVG and depth layers here. -->
    <span class="card__screen"
          data-screen-sequence
          data-fade-duration="450"
          data-sequence-playing="true">
      <span class="card__frame"
            data-screen-frame
            data-frame-active
            data-frame-mode="video"
            data-hold-duration="0">
        <span class="card__frame-media">
          <video class="card__video card__video--cover"
                 src="/path/to/first-recording.mp4"
                 muted playsinline preload="auto"></video>
        </span>
      </span>
      <!-- Add the next frame here, without data-frame-active. -->
    </span>
    <!-- Keep the generated phone hardware SVG here. -->
  </span>
</a>
```

Each video must remain inside its own `card__frame-media`, inside its frame, inside the one screen, inside the one phone. Only the first frame receives `data-frame-active`. Frame order determines playback order. Do not paste the card inside an existing paragraph or link.

### Editable settings

| Purpose | Storybook control | Generated HTML |
| --- | --- | --- |
| Optional destination | `card_url` | A URL renders an `a` with `href`; empty renders a non-clickable `div` |
| Native screen width | `display_size: native-screen` | `card--native-screen` on the outer card |
| Square thumbnail | `display_size: thumbnail` | `card--thumbnail` on the outer card |
| Transparent background | `background_mode: transparent` | `card--transparent`, without the background SVG |
| Cursor following | `follow_cursor: true` or `false` | `data-follow-cursor="true"` or `"false"` |
| Start or stop the sequence | `is_playing` | `data-sequence-playing="true"` or `"false"` |
| Crossfade duration | `fade_duration_ms` | `data-fade-duration="450"` in milliseconds |
| Video file | Frame `video_source` | Each video's `src` |
| Play the entire recording | Frame `hold_ms: 0` | `data-hold-duration="0"` |
| Timed frame | Frame `hold_ms: 3000` | `data-hold-duration="3000"` in milliseconds |
| Static fallback | `fallback_source` | The `card__poster-image` source |
| Island and top band | `island_overlay`, with per-frame overrides | Generated island SVG and static-image inset |

Use the generator when changing the background, device era, screen preset, island or cursor-following mode: these options change artwork and nested markup as well as classes. A gradient background needs its SVG; changing a class alone will not create it. Screen presets and eras must keep the screen proportions, case geometry and hardware consistent.

`compact-screen` gives a 375px screen; `large-screen` gives a 414px screen at native size. Modern heights are 812px and 896px; classic heights are 667px and 736px. Smaller containers scale the phone proportionally.

With a destination URL, hover pauses media playback, but an in-progress crossfade finishes before pausing. Cursor tilt continues while hovered when enabled. Reduced motion disables the sequence and cursor movement. The poster provides a static fallback when JavaScript is unavailable. Clear `card_url` for a regular preview without link semantics, pointer cursor, hover effects or cursor tracking. Media playback continues without pausing on hover.

While the poster image loads, the phone screen shows a token-colored shimmer. The poster and still screenshots crop tall sources from the top to fill the screen rather than squeezing the entire page into the phone. Scrolling frames keep their full image height and existing playback behavior.

### Complete ScatchApp example

The following HTML contains both supplied recordings, a native-size modern phone, a transparent background and a non-clickable wrapper without hover effects. Its asset URLs target this Drupal theme; they are not portable video URLs for another website. The SVG IDs and every corresponding `url(#...)` reference must be unique if you place multiple copies on one page.

The maintained source is `generated/content/scatchapp-detail-preview.html`, produced by `node scripts/build-scatchapp-preview.mjs` using the shared `card_markup()` renderer. For developer integration, the existing `scripts/update-scatchapp-video-preview.php` demonstrates a targeted revision-preserving content update; it is not a general repair command and deliberately leaves an already-marked preview alone.

The classic phone casing uses neutral black glass with grayscale polished-metal highlights, independent of the corporate dark-theme colors. Screen content retains its original colors.
