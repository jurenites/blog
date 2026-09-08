(function jurenitesProgressiveImageBehavior(Drupal, once) {
  const set_complete_stage = (progressive_wrapper) => {
    progressive_wrapper.dataset.loadingStage = "complete";
    progressive_wrapper.setAttribute("aria-busy", "false");
  };

  const set_error_stage = (progressive_wrapper) => {
    progressive_wrapper.dataset.loadingStage = "error";
    progressive_wrapper.setAttribute("aria-busy", "false");
  };

  const color_channel_hex = (channel_value) => Math.round(channel_value)
    .toString(16)
    .padStart(2, "0");

  function calculate_average_color(preview_source, image_document) {
    return new Promise((resolve_average_color) => {
      const placeholder_image = image_document.createElement("img");

      placeholder_image.addEventListener("load", () => {
        const color_canvas = image_document.createElement("canvas");
        const color_context = color_canvas.getContext("2d", { willReadFrequently: true });

        if (!color_context) {
          resolve_average_color(null);
          return;
        }

        color_canvas.width = placeholder_image.naturalWidth;
        color_canvas.height = placeholder_image.naturalHeight;
        color_context.drawImage(placeholder_image, 0, 0);

        const pixel_values = color_context.getImageData(
          0,
          0,
          color_canvas.width,
          color_canvas.height,
        ).data;
        let red_total = 0;
        let green_total = 0;
        let blue_total = 0;
        let alpha_total = 0;

        for (let channel_index = 0; channel_index < pixel_values.length; channel_index += 4) {
          const alpha_weight = pixel_values[channel_index + 3] / 255;
          red_total += pixel_values[channel_index] * alpha_weight;
          green_total += pixel_values[channel_index + 1] * alpha_weight;
          blue_total += pixel_values[channel_index + 2] * alpha_weight;
          alpha_total += alpha_weight;
        }

        if (alpha_total === 0) {
          resolve_average_color(null);
          return;
        }

        resolve_average_color(
          `#${color_channel_hex(red_total / alpha_total)}${color_channel_hex(
            green_total / alpha_total,
          )}${color_channel_hex(blue_total / alpha_total)}`,
        );
      }, { once: true });
      placeholder_image.addEventListener("error", () => resolve_average_color(null), {
        once: true,
      });
      placeholder_image.src = preview_source;
    });
  }

  function apply_average_color(progressive_wrapper, preview_source, image_document) {
    if (!preview_source) {
      return;
    }

    calculate_average_color(preview_source, image_document).then((average_color) => {
      if (!average_color || !progressive_wrapper.isConnected) {
        return;
      }

      progressive_wrapper.style.setProperty("--progressive-image-average-color", average_color);
      progressive_wrapper.dataset.averageColor = average_color;
    });
  }

  Drupal.behaviors.jurenites_progressive_images = {
    attach(page_context) {
      once("jurenites-progressive-image", "img[data-progressive-image]", page_context).forEach(
        (image_element) => {
          const progressive_wrapper = document.createElement("span");
          const preview_element = document.createElement("span");
          const loading_line = document.createElement("span");
          const rendered_image =
            image_element.parentElement?.tagName === "PICTURE"
              ? image_element.parentElement
              : image_element;
          const intrinsic_width = image_element.dataset.progressiveImageWidth;
          const intrinsic_height = image_element.dataset.progressiveImageHeight;
          const preview_source = image_element.dataset.progressiveImagePreview;

          progressive_wrapper.className = "jurenites-progressive-image";
          progressive_wrapper.dataset.loadingStage = "placeholder";
          progressive_wrapper.setAttribute("aria-busy", "true");
          if (intrinsic_width && intrinsic_height) {
            progressive_wrapper.style.aspectRatio = `${intrinsic_width} / ${intrinsic_height}`;
          }

          preview_element.className =
            "jurenites-progressive-image__preview jurenites-progressive-image__skeleton";
          preview_element.setAttribute("aria-hidden", "true");
          delete image_element.dataset.progressiveImageWidth;
          delete image_element.dataset.progressiveImageHeight;
          delete image_element.dataset.progressiveImagePreview;
          image_element.classList.remove("img-blurry-placeholder", "loading");

          loading_line.className = "jurenites-progressive-image__loading-line";
          loading_line.setAttribute("aria-hidden", "true");

          rendered_image.before(progressive_wrapper);
          progressive_wrapper.append(preview_element, rendered_image, loading_line);
          apply_average_color(progressive_wrapper, preview_source, image_element.ownerDocument);

          if (image_element.complete) {
            if (image_element.naturalWidth > 0) {
              set_complete_stage(progressive_wrapper);
            } else {
              set_error_stage(progressive_wrapper);
            }
            return;
          }

          requestAnimationFrame(() => {
            progressive_wrapper.dataset.loadingStage = "image";
          });
          image_element.addEventListener("load", () => set_complete_stage(progressive_wrapper), {
            once: true,
          });
          image_element.addEventListener("error", () => set_error_stage(progressive_wrapper), {
            once: true,
          });
        },
      );
    },
  };
})(Drupal, once);
