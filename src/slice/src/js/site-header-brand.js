export function enable_site_header_brand(brand_link) {
  if (brand_link.jurenites_brand_initialized) {
    return;
  }

  brand_link.jurenites_brand_initialized = true;
  const brand_window = brand_link.ownerDocument.defaultView;
  let close_timeout = null;
  let reveal_finished_at = 0;

  function read_duration(token_name) {
    const token_value = brand_window.getComputedStyle(brand_link)
      .getPropertyValue(`--component-site-header-brand-name-${token_name}-default`).trim();
    return parseFloat(token_value) * (token_value.endsWith('ms') ? 1 : 1000);
  }

  function reveal_brand_name() {
    brand_window.clearTimeout(close_timeout);
    if (brand_link.classList.contains('is-brand-revealed')) {
      return;
    }

    brand_link.classList.add('is-brand-revealed');
    const letter_count = brand_link.querySelectorAll('.site-header__brand-name-letter').length;
    const reduced_motion = brand_window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveal_duration = reduced_motion ? 0 : read_duration('reveal-duration')
      + Math.max(0, letter_count - 1) * read_duration('reveal-stagger');
    reveal_finished_at = brand_window.performance.now() + reveal_duration;
  }

  function schedule_brand_close() {
    brand_window.clearTimeout(close_timeout);
    if (brand_link.matches(':hover, :focus-visible')) {
      return;
    }

    const remaining_reveal = Math.max(0, reveal_finished_at - brand_window.performance.now());
    close_timeout = brand_window.setTimeout(() => {
      if (!brand_link.matches(':hover, :focus-visible')) {
        brand_link.classList.remove('is-brand-revealed');
      }
    }, remaining_reveal + read_duration('hold-duration'));
  }

  brand_link.classList.add('site-header__brand--enhanced');
  brand_link.addEventListener('pointerenter', reveal_brand_name);
  brand_link.addEventListener('pointerleave', schedule_brand_close);
  brand_link.addEventListener('focus', () => {
    if (brand_link.matches(':focus-visible')) {
      reveal_brand_name();
    }
  });
  brand_link.addEventListener('blur', schedule_brand_close);
  if (brand_link.matches(':hover, :focus-visible')) {
    reveal_brand_name();
  }
}
