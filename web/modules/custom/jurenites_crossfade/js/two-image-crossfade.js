(function jurenitesCrossfadeBehavior(Drupal, once) {
  Drupal.behaviors.jurenites_two_image_crossfade = {
    attach(page_context) {
      once("jurenites-two-image-crossfade", "[data-two-image-crossfade]", page_context).forEach(
        (crossfade_element) => {
          const image_elements = Array.from(crossfade_element.querySelectorAll("img")).slice(0, 2);
          const loading_promises = image_elements.map((image_element) => {
            if (image_element.complete) {
              return Promise.resolve();
            }

            return new Promise((resolve_image) => {
              image_element.addEventListener("load", resolve_image, { once: true });
              image_element.addEventListener("error", resolve_image, { once: true });
            });
          });

          Promise.all(loading_promises).then(() => {
            crossfade_element.classList.add("is-ready");
          });
        },
      );
    },
  };
})(Drupal, once);
