(function jurenitesProgressiveImageBehavior(Drupal, once) {
  const set_complete_stage = (progressive_wrapper) => {
    progressive_wrapper.dataset.loadingStage = "complete";
  };

  const set_error_stage = (progressive_wrapper) => {
    progressive_wrapper.dataset.loadingStage = "error";
  };

  Drupal.behaviors.jurenites_progressive_images = {
    attach(page_context) {
      once("jurenites-progressive-image", "img[data-progressive-image]", page_context).forEach(
        (image_element) => {
          const progressive_wrapper = document.createElement("span");
          const loading_line = document.createElement("span");
          const rendered_image =
            image_element.parentElement?.tagName === "PICTURE"
              ? image_element.parentElement
              : image_element;
          const intrinsic_width = image_element.getAttribute("width");
          const intrinsic_height = image_element.getAttribute("height");

          progressive_wrapper.className = "jurenites-progressive-image";
          progressive_wrapper.dataset.loadingStage = "placeholder";
          if (intrinsic_width && intrinsic_height) {
            progressive_wrapper.style.aspectRatio = `${intrinsic_width} / ${intrinsic_height}`;
          }

          loading_line.className = "jurenites-progressive-image__loading-line";
          loading_line.setAttribute("aria-hidden", "true");

          rendered_image.before(progressive_wrapper);
          progressive_wrapper.append(rendered_image, loading_line);

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
