import { create_swipe_motion } from './screen-swipe.js';

// Frame timing is content configuration; fades and scrolling never resize images.
export function install_screen_sequence(card_element, abort_signal) {
  const screen_element = card_element.querySelector('[data-screen-sequence]');
  if (!screen_element) return;
  const frame_elements = [...screen_element.querySelectorAll('[data-screen-frame]')];
  if (!frame_elements.length) return;
  const poster_element = screen_element.querySelector('.card__poster');
  const poster_image = poster_element?.querySelector('.card__poster-image');
  if (poster_image) {
    const finish_poster_loading = () => {
      poster_element.removeAttribute('data-poster-loading');
      poster_element.setAttribute('data-poster-ready', '');
    };
    if (poster_image.complete && poster_image.naturalWidth > 0) {
      finish_poster_loading();
    } else if (poster_image.complete) {
      poster_element.setAttribute('data-poster-error', '');
    } else {
      poster_element.setAttribute('data-poster-loading', '');
      poster_image.addEventListener('load', finish_poster_loading, { once: true, signal: abort_signal });
      poster_image.addEventListener('error', () => {
        poster_element.removeAttribute('data-poster-loading');
        poster_element.setAttribute('data-poster-error', '');
      }, { once: true, signal: abort_signal });
    }
  }
  const motion_query = matchMedia('(prefers-reduced-motion: reduce)');
  const live_animations = new Set();
  const crossfade_animations = new Set();
  let sequence_revision = 0;
  let is_visible = true;
  let images_ready = false;
  let playback_controller = new AbortController();
  const phone_hover_only = Boolean(card_element.closest('[data-smep-preview]'));
  const hover_element = phone_hover_only ? card_element.querySelector('[data-card-phone]') : card_element;
  const hover_enabled = Boolean(hover_element) && (phone_hover_only
    || card_element.matches('a[href], .accountia-preview__phone > .card'));
  let is_hovered = hover_enabled && hover_element.matches(':hover');
  let active_video = null;
  const gif_controllers = new Map();
  const drag_enabled = card_element.matches('.accountia-preview__phone > .card');
  let drag_state = null;

  function screen_scroll_overflow(image_element) {
    if (!image_element?.naturalWidth || !image_element.naturalHeight) return 0;
    // The image is two pixels wider than the screen to hide edge seams. That
    // visual overscan must not turn a full-height screenshot into a scroll.
    const source_height = image_element.naturalHeight * screen_element.clientWidth / image_element.naturalWidth;
    if (source_height <= screen_element.clientHeight + 1) return 0;
    return Math.max(0, image_element.offsetHeight - screen_element.clientHeight);
  }

  function start_screen_drag(pointer_event) {
    if (pointer_event.pointerType !== 'mouse' || pointer_event.button !== 0 || drag_state
      || !images_ready || crossfade_animations.size) return;
    const frame_element = screen_element.querySelector('[data-frame-active][aria-hidden="false"]');
    const image_element = frame_element?.querySelector('img');
    if (!image_element || frame_element.dataset.scrollBehavior !== 'swipe') return;
    const overflow_height = screen_scroll_overflow(image_element);
    if (overflow_height <= 1) return;
    const image_transform = new DOMMatrixReadOnly(getComputedStyle(image_element).transform);
    const scroll_position = Math.min(overflow_height, Math.max(0, -image_transform.m42));
    const scroll_animation = [...live_animations].reverse().find(frame_animation =>
      frame_animation.effect.target === image_element
      && (frame_animation.playState !== 'finished' || motion_query.matches
        || screen_element.dataset.sequencePlaying === 'false'));
    drag_state = {
      pointer_id: pointer_event.pointerId, start_y: pointer_event.clientY,
      start_position: scroll_position, scroll_position, overflow_height,
      display_scale: screen_element.getBoundingClientRect().height / screen_element.clientHeight,
      image_element, scroll_animation, has_moved: false,
    };
    card_element.setPointerCapture(pointer_event.pointerId);
    card_element.setAttribute('data-screen-dragging', '');
    pointer_event.preventDefault();
  }

  function move_screen_drag(pointer_event) {
    if (!drag_state || pointer_event.pointerId !== drag_state.pointer_id) return;
    drag_state.scroll_position = Math.min(drag_state.overflow_height, Math.max(0,
      drag_state.start_position + (drag_state.start_y - pointer_event.clientY) / drag_state.display_scale));
    const drag_transform = `translateY(${-drag_state.scroll_position}px)`;
    const key_frames = [{ transform: drag_transform }, { transform: drag_transform }];
    if (!drag_state.scroll_animation) {
      drag_state.scroll_animation = drag_state.image_element.animate(key_frames, { duration: 1, fill: 'forwards' });
      live_animations.add(drag_state.scroll_animation);
    }
    drag_state.scroll_animation.pause();
    drag_state.scroll_animation.effect.setKeyframes(key_frames);
    drag_state.scroll_animation.currentTime = 0;
    drag_state.has_moved = true;
    pointer_event.preventDefault();
  }

  function finish_screen_drag(pointer_event) {
    if (!drag_state || pointer_event.pointerId !== drag_state.pointer_id) return;
    const completed_drag = drag_state;
    drag_state = null;
    card_element.removeAttribute('data-screen-dragging');
    if (card_element.hasPointerCapture(completed_drag.pointer_id)) {
      card_element.releasePointerCapture(completed_drag.pointer_id);
    }
    if (completed_drag.has_moved && !motion_query.matches && screen_element.dataset.sequencePlaying !== 'false') {
      const remaining_motion = create_swipe_motion(completed_drag.overflow_height, screen_element.clientHeight,
        completed_drag.scroll_position, 400, 800);
      completed_drag.scroll_animation.effect.setKeyframes(remaining_motion.key_frames);
      completed_drag.scroll_animation.effect.updateTiming({ duration: remaining_motion.duration_ms });
      completed_drag.scroll_animation.currentTime = 0;
    }
    const card_bounds = card_element.getBoundingClientRect();
    const pointer_inside = pointer_event.clientX >= card_bounds.left && pointer_event.clientX <= card_bounds.right
      && pointer_event.clientY >= card_bounds.top && pointer_event.clientY <= card_bounds.bottom;
    set_hover_pause({ pointerType: 'mouse', type: pointer_inside ? 'pointerenter' : 'pointerleave' });
  }

  function stop_gif(frame_element) {
    const gif_state = gif_controllers.get(frame_element);
    if (!gif_state) return;
    cancelAnimationFrame(gif_state.frame_request);
    release_animation(gif_state.clock_animation);
    gif_controllers.delete(frame_element);
  }

  function start_gif(frame_element) {
    const gif_element = frame_element.querySelector('[data-gif-frames]');
    if (!gif_element) return;
    const frame_durations = JSON.parse(gif_element.dataset.gifFrames);
    const total_duration = frame_durations.reduce((total_time, frame_time) => total_time + frame_time, 0);
    const frame_width = Number(gif_element.dataset.gifWidth);
    const frame_height = Number(gif_element.dataset.gifHeight);
    const edge_element = frame_element.querySelector('[data-gif-edge]');
    const clock_animation = gif_element.animate([{ opacity: 1 }, { opacity: 1 }], { duration: total_duration, iterations: Infinity });
    live_animations.add(clock_animation);
    if (is_hovered) clock_animation.pause();
    const gif_state = { clock_animation, frame_request: 0 };
    function update_gif() {
      let frame_time = Number(clock_animation.currentTime || 0) % total_duration;
      let frame_index = 0;
      while (frame_index < frame_durations.length - 1 && frame_time >= frame_durations[frame_index]) {
        frame_time -= frame_durations[frame_index++];
      }
      gif_element.setAttribute('viewBox', `${frame_index * frame_width} 0 ${frame_width} ${frame_height}`);
      edge_element?.setAttribute('viewBox', `${frame_index * frame_width} ${frame_height - 1} ${frame_width} 1`);
      gif_state.frame_request = requestAnimationFrame(update_gif);
    }
    gif_controllers.set(frame_element, gif_state);
    update_gif();
  }

  function set_hover_pause(pointer_event) {
    if (pointer_event.pointerType === 'touch') return;
    is_hovered = pointer_event.type === 'pointerenter';
    live_animations.forEach((frame_animation) => {
      if (crossfade_animations.has(frame_animation) || frame_animation.playState === 'finished') return;
      if (is_hovered) frame_animation.pause();
      else frame_animation.play();
    });
    if (active_video && !active_video.ended) {
      if (is_hovered) active_video.pause();
      else void active_video.play().catch(() => {});
    }
  }

  function numeric_value(raw_value, default_value, minimum_value = 0) {
    const parsed_value = Number(raw_value);
    return Number.isFinite(parsed_value) ? Math.max(minimum_value, parsed_value) : default_value;
  }

  function reset_sequence() {
    if (drag_state) {
      const pointer_id = drag_state.pointer_id;
      drag_state = null;
      card_element.removeAttribute('data-screen-dragging');
      if (card_element.hasPointerCapture(pointer_id)) card_element.releasePointerCapture(pointer_id);
    }
    for (const frame_element of gif_controllers.keys()) stop_gif(frame_element);
    active_video = null;
    playback_controller.abort();
    playback_controller = new AbortController();
    sequence_revision += 1;
    live_animations.forEach((frame_animation) => frame_animation.cancel());
    live_animations.clear();
    crossfade_animations.clear();
    frame_elements.forEach((frame_element, frame_index) => {
      const video_element = frame_element.querySelector('video');
      if (video_element) {
        video_element.pause();
        if (video_element.readyState > 0) video_element.currentTime = 0;
      }
      const gif_element = frame_element.querySelector('[data-gif-frames]');
      if (gif_element) {
        gif_element.setAttribute('viewBox', `0 0 ${gif_element.dataset.gifWidth} ${gif_element.dataset.gifHeight}`);
        frame_element.querySelector('[data-gif-edge]')?.setAttribute('viewBox', `0 ${Number(gif_element.dataset.gifHeight) - 1} ${gif_element.dataset.gifWidth} 1`);
      }
      frame_element.toggleAttribute('data-frame-active', frame_index === 0);
      frame_element.setAttribute('aria-hidden', String(frame_index !== 0));
    });
  }

  async function animate_element(target_element, key_frames, duration_ms, run_revision, pause_on_hover = true) {
    if (run_revision !== sequence_revision) throw new Error('Sequence reset');
    const frame_animation = target_element.animate(key_frames, {
      duration: duration_ms, easing: 'linear', fill: 'forwards',
    });
    live_animations.add(frame_animation);
    if (!pause_on_hover) crossfade_animations.add(frame_animation);
    if (is_hovered && pause_on_hover) frame_animation.pause();
    await frame_animation.finished;
    if (run_revision !== sequence_revision) throw new Error('Sequence reset');
    return frame_animation;
  }

  function release_animation(frame_animation) {
    frame_animation.cancel();
    live_animations.delete(frame_animation);
    crossfade_animations.delete(frame_animation);
  }

  async function hold_frame(frame_element, duration_ms, run_revision) {
    const hold_animation = await animate_element(frame_element, [{ opacity: 1 }, { opacity: 1 }], duration_ms, run_revision);
    release_animation(hold_animation);
  }

  async function play_video_frame(frame_element, run_revision) {
    const video_element = frame_element.querySelector('video');
    const playback_signal = playback_controller.signal;
    video_element.muted = true;
    active_video = video_element;
    video_element.currentTime = 0;
    try {
      await video_element.play();
      if (is_hovered) video_element.pause();
    } catch {
      // A blocked or unavailable video must not stall the other frames.
      await hold_frame(frame_element, 2000, run_revision);
      active_video = null;
      return;
    }
    if (playback_signal.aborted) throw new Error('Sequence reset');
    const hold_duration = numeric_value(frame_element.dataset.holdDuration, 0);
    if (hold_duration > 0) {
      await hold_frame(frame_element, hold_duration, run_revision);
    } else if (!video_element.ended) {
      await new Promise((resolve_playback, reject_playback) => {
        function finish_playback() { cleanup_events(); resolve_playback(); }
        function abort_playback() { cleanup_events(); reject_playback(new Error('Sequence reset')); }
        function cleanup_events() {
          video_element.removeEventListener('ended', finish_playback);
          video_element.removeEventListener('error', finish_playback);
          playback_signal.removeEventListener('abort', abort_playback);
        }
        video_element.addEventListener('ended', finish_playback, { once: true });
        video_element.addEventListener('error', finish_playback, { once: true });
        playback_signal.addEventListener('abort', abort_playback, { once: true });
      });
    }
    video_element.pause();
    active_video = null;
  }

  function prepare_scroll_start(frame_element) {
    const image_element = frame_element.querySelector('img');
    if (!image_element || frame_element.dataset.scrollBehavior !== 'swipe' || frame_element.dataset.scrollStart !== 'bottom') return null;
    const overflow_height = screen_scroll_overflow(image_element);
    if (overflow_height <= 1) return null;
    const start_animation = image_element.animate([{ transform: `translateY(-${overflow_height}px)` }], { duration: 0, fill: 'forwards' });
    live_animations.add(start_animation);
    return start_animation;
  }

  async function play_sequence(run_revision) {
    let frame_index = 0;
    let start_animation = prepare_scroll_start(frame_elements[0]);
    start_gif(frame_elements[0]);
    while (run_revision === sequence_revision) {
      const frame_element = frame_elements[frame_index];
      const image_element = frame_element.querySelector('img');
      const uses_swipes = frame_element.dataset.frameMode === 'scroll' && frame_element.dataset.scrollBehavior === 'swipe';
      if (frame_element.dataset.frameMode === 'video') {
        await play_video_frame(frame_element, run_revision);
      } else if (!uses_swipes) {
        await hold_frame(frame_element, numeric_value(frame_element.dataset.holdDuration, 2000, 100), run_revision);
      }
      // Measure untransformed layout: cursor tilt must not alter scroll distance.
      const overflow_height = screen_scroll_overflow(image_element);
      if (uses_swipes && overflow_height > 1 && image_element.naturalWidth) {
        const swipe_motion = create_swipe_motion(overflow_height, screen_element.clientHeight,
          frame_element.dataset.scrollStart, numeric_value(frame_element.dataset.holdDuration, 900, 100),
          numeric_value(frame_element.dataset.bottomDuration, 800));
        const swipe_animation = await animate_element(image_element, swipe_motion.key_frames, swipe_motion.duration_ms, run_revision);
        // Keep the final position through the crossfade; release it once hidden.
        if (start_animation) release_animation(start_animation);
        start_animation = swipe_animation;
      } else if (uses_swipes) {
        await hold_frame(frame_element, numeric_value(frame_element.dataset.holdDuration, 1600, 100), run_revision);
      } else if (frame_element.dataset.frameMode === 'scroll' && overflow_height > 1 && image_element.naturalWidth) {
        const image_scale = image_element.clientWidth / image_element.naturalWidth;
        const scroll_speed = numeric_value(frame_element.dataset.scrollSpeed, 70, 1) * image_scale;
        const travel_duration = overflow_height / scroll_speed * 1000;
        const scroll_animation = await animate_element(image_element,
          [{ transform: 'translateY(0)' }, { transform: `translateY(-${overflow_height}px)` }], travel_duration, run_revision);
        await hold_frame(frame_element, numeric_value(frame_element.dataset.bottomDuration, 800), run_revision);
        const return_animation = await animate_element(image_element,
          [{ transform: `translateY(-${overflow_height}px)` }, { transform: 'translateY(0)' }], travel_duration, run_revision);
        release_animation(scroll_animation);
        release_animation(return_animation);
      }
      if (frame_elements.length === 1) {
        if (start_animation) release_animation(start_animation);
        start_animation = prepare_scroll_start(frame_element);
        continue;
      }
      const next_index = (frame_index + 1) % frame_elements.length;
      const next_frame = frame_elements[next_index];
      const next_start = prepare_scroll_start(next_frame);
      next_frame.setAttribute('data-frame-active', '');
      next_frame.setAttribute('aria-hidden', 'false');
      start_gif(next_frame);
      frame_element.setAttribute('aria-hidden', 'true');
      const fade_duration = numeric_value(screen_element.dataset.fadeDuration, 450);
      // Finish a started crossfade, then pause the incoming frame's hold on hover.
      const fade_animations = await Promise.all([
        animate_element(frame_element, [{ opacity: 1 }, { opacity: 0 }], fade_duration, run_revision, false),
        animate_element(next_frame, [{ opacity: 0 }, { opacity: 1 }], fade_duration, run_revision, false),
      ]);
      frame_element.removeAttribute('data-frame-active');
      stop_gif(frame_element);
      if (start_animation) release_animation(start_animation);
      start_animation = next_start;
      fade_animations.forEach(release_animation);
      frame_index = next_index;
    }
  }

  function restart_sequence() {
    reset_sequence();
    if (!images_ready || abort_signal.aborted || !is_visible || document.hidden
      || motion_query.matches || screen_element.dataset.sequencePlaying === 'false') return;
    // Cancellation during detach, resize or preference changes is expected.
    void play_sequence(sequence_revision).catch(() => {});
  }

  const event_options = { signal: abort_signal };
  if (hover_enabled) {
    hover_element.addEventListener('pointerenter', set_hover_pause, event_options);
    hover_element.addEventListener('pointerleave', set_hover_pause, event_options);
  }
  if (drag_enabled) {
    card_element.addEventListener('pointerdown', start_screen_drag, event_options);
    card_element.addEventListener('pointermove', move_screen_drag, event_options);
    card_element.addEventListener('pointerup', finish_screen_drag, event_options);
    card_element.addEventListener('pointercancel', finish_screen_drag, event_options);
    card_element.addEventListener('lostpointercapture', finish_screen_drag, event_options);
    card_element.addEventListener('dragstart', pointer_event => pointer_event.preventDefault(), event_options);
  }
  motion_query.addEventListener('change', restart_sequence, event_options);
  document.addEventListener('visibilitychange', restart_sequence, event_options);
  const resize_observer = new ResizeObserver(restart_sequence);
  resize_observer.observe(screen_element);
  const visibility_observer = new IntersectionObserver((observer_entries) => {
    is_visible = observer_entries[0].isIntersecting;
    restart_sequence();
  });
  visibility_observer.observe(card_element);
  abort_signal.addEventListener('abort', () => {
    reset_sequence();
    screen_element.removeAttribute('data-sequence-ready');
    resize_observer.disconnect();
    visibility_observer.disconnect();
  }, { once: true });
  void Promise.allSettled(frame_elements.map((frame_element) => {
    const image_element = frame_element.querySelector('img');
    if (image_element) return image_element.decode();
    const gif_sprite = frame_element.querySelector('[data-gif-frames] image');
    if (!gif_sprite) return undefined;
    const sprite_image = new Image();
    sprite_image.src = gif_sprite.getAttribute('href');
    return sprite_image.decode();
  }))
    .then(() => {
      if (abort_signal.aborted) return;
      frame_elements.forEach((frame_element) => {
        const image_element = frame_element.querySelector('img');
        const edge_element = frame_element.querySelector('[data-screen-edge-fill]');
        if (!edge_element || !image_element.naturalWidth || !image_element.naturalHeight) return;
        // SVG geometry crops exactly the final source pixel row. Flex fills only
        // the spare screen height; the main raster keeps its intrinsic ratio.
        edge_element.setAttribute('viewBox', `0 ${image_element.naturalHeight - 1} ${image_element.naturalWidth} 1`);
        const edge_image = edge_element.querySelector('image');
        edge_image.setAttribute('width', String(image_element.naturalWidth));
        edge_image.setAttribute('height', String(image_element.naturalHeight));
      });
      // Reuse the original first pixel row, preserving horizontal color variation.
      screen_element.querySelectorAll('[data-screen-top-fill]').forEach((top_element) => {
        const top_image = top_element.querySelector('image');
        const source_image = new Image();
        source_image.src = top_image.getAttribute('href');
        void source_image.decode().then(() => {
          if (abort_signal.aborted) return;
          top_element.setAttribute('viewBox', `0 0 ${source_image.naturalWidth} 1`);
          top_image.setAttribute('width', String(source_image.naturalWidth));
          top_image.setAttribute('height', String(source_image.naturalHeight));
        }).catch(() => {});
      });
      images_ready = true;
      screen_element.setAttribute('data-sequence-ready', '');
      restart_sequence();
    });
}
