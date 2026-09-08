import { run_design_system_sync } from './design-system-sync.js';

run_design_system_sync()
  .then((sync_result) => {
    const sync_counts = sync_result.counts;
    const fallback_summary = sync_result.font_fallbacks
      .map((fallback_record) => `${fallback_record.requested_family} → ${fallback_record.applied_family}`)
      .join(', ');
    const fallback_message = fallback_summary ? ` Font fallbacks: ${fallback_summary}.` : '';
    figma.closePlugin(
      `Synced ${sync_counts.variables} variables, ${sync_counts.text_styles} text styles, and ${sync_counts.effect_styles} effect styles.${fallback_message}`,
    );
  })
  .catch((sync_error) => {
    figma.closePluginWithFailure(sync_error instanceof Error ? sync_error.message : String(sync_error));
  });
