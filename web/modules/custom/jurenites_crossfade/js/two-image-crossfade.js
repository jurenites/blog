(function jurenitesCrossfadeBehavior(Drupal, once) {
  Drupal.behaviors.jurenites_two_image_crossfade = {
    attach(page_context) {
      once("jurenites-two-image-crossfade", "[data-two-image-crossfade]", page_context).forEach(
        (crossfade_element) => {
          const image_elements = Array.from(crossfade_element.querySelectorAll("img")).slice(0, 2);
          const frame_elements = Array.from(crossfade_element.querySelectorAll("[data-crossfade-frame]"));
          const dot_elements = Array.from(crossfade_element.querySelectorAll("[data-crossfade-dot]"));
          const hold_duration = Number.parseInt(crossfade_element.dataset.holdDuration, 10);
          const transition_duration = Number.parseInt(
            crossfade_element.dataset.transitionDuration,
            10,
          );
          let active_frame_index = 0;
          let is_pointer_paused = false;
          let rotation_timeout;

          const show_frame = (next_frame_index) => {
            active_frame_index = next_frame_index;
            frame_elements.forEach((frame_element, frame_index) => {
              frame_element.classList.toggle("is-active", frame_index === active_frame_index);
            });
            dot_elements.forEach((dot_element, dot_index) => {
              const is_active_dot = dot_index === active_frame_index;
              dot_element.classList.toggle("is-active", is_active_dot);
              dot_element.setAttribute("aria-pressed", String(is_active_dot));
            });
          };

          const schedule_next_frame = (delay_duration) => {
            window.clearTimeout(rotation_timeout);
            rotation_timeout = window.setTimeout(() => {
              show_frame((active_frame_index + 1) % frame_elements.length);
              schedule_next_frame(hold_duration + transition_duration);
            }, delay_duration);
          };

          const loading_promises = image_elements.map((image_element) => {
            if (image_element.complete) {
              return Promise.resolve(image_element.naturalWidth > 0);
            }

            return new Promise((resolve_image) => {
              image_element.addEventListener("load", () => resolve_image(true), { once: true });
              image_element.addEventListener("error", () => resolve_image(false), { once: true });
            });
          });

          dot_elements.forEach((dot_element, dot_index) => {
            dot_element.addEventListener("click", () => {
              show_frame(dot_index);
              if (!is_pointer_paused) {
                schedule_next_frame(hold_duration + transition_duration);
              }
            });
          });

          crossfade_element.addEventListener("pointerenter", () => {
            is_pointer_paused = true;
            window.clearTimeout(rotation_timeout);
            crossfade_element.classList.add("is-paused");
          });
          crossfade_element.addEventListener("pointerleave", () => {
            is_pointer_paused = false;
            crossfade_element.classList.remove("is-paused");
            if (crossfade_element.classList.contains("is-ready")) {
              schedule_next_frame(hold_duration);
            }
          });

          Promise.all(loading_promises).then((loading_results) => {
            if (!loading_results.every(Boolean)) {
              crossfade_element.classList.add("has-image-error");
              return;
            }
            crossfade_element.classList.add("is-ready");
            schedule_next_frame(hold_duration);
          });
        },
      );
    },
  };
})(Drupal, once);
