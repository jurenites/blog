// Atom: Icon. SVG geometry is stored in the shared public icon assets folder.
import { icon_markup } from "./icon.markup.js";
import { escape_html } from "../../template.js";
import { useArgs as use_story_args } from "@storybook/preview-api";

const ICON_ASSET_MODULES = import.meta.glob("/src/public/assets/icons/*.svg", {
  eager: true,
  import: "default",
  query: "?url",
});
const ICON_FILE_NAMES = Object.keys(ICON_ASSET_MODULES)
  .map((asset_path) => asset_path.split("/").pop())
  .sort();
const ICON_NAME = ICON_FILE_NAMES[0];

function icon_gallery_item_markup(icon_file_name) {
  const icon_machine_name = icon_file_name.replace(/\.svg$/i, "");
  return `<li class="icon-gallery__item" data-icon-machine-name="${escape_html(icon_machine_name)}" tabindex="0" role="button" aria-label="Select ${escape_html(icon_machine_name)}">
    ${icon_markup({ icon_name: icon_file_name, with_tooltip: true })}
    <code>${escape_html(icon_machine_name)}</code>
  </li>`;
}

function render_story({ icon_name }) {
  const [, update_story_args] = use_story_args();
  const icon_machine_name = icon_name.replace(/\.svg$/i, "");
  const story_element = document.createElement("main");
  story_element.className = "icon-gallery";
  story_element.innerHTML = `
    <section class="icon-gallery__selected" aria-labelledby="icon-gallery-selected-heading">
      <h2 id="icon-gallery-selected-heading">Selected icon</h2>
      <div class="icon-gallery__selected-item">
        ${icon_markup({ icon_name, with_tooltip: true })}
        <code>${escape_html(icon_machine_name)}</code>
      </div>
    </section>
    <section aria-labelledby="icon-gallery-all-heading">
      <h2 id="icon-gallery-all-heading">All icons</h2>
      <ul class="icon-gallery__grid">
        ${ICON_FILE_NAMES.map(icon_gallery_item_markup).join("")}
      </ul>
    </section>
  `;

  const selected_item_element = story_element.querySelector(".icon-gallery__selected-item");
  const gallery_item_elements = story_element.querySelectorAll(".icon-gallery__item");

  function update_selected_icon(icon_file_name) {
    const selected_machine_name = icon_file_name.replace(/\.svg$/i, "");
    selected_item_element.innerHTML = `
      ${icon_markup({ icon_name: icon_file_name, with_tooltip: true })}
      <code>${escape_html(selected_machine_name)}</code>
    `;
  }

  gallery_item_elements.forEach((gallery_item_element) => {
    const gallery_machine_name = gallery_item_element.dataset.iconMachineName;
    const select_gallery_item = () => {
      update_selected_icon(gallery_machine_name);
      update_story_args({ icon_name: `${gallery_machine_name}.svg` });
    };

    gallery_item_element.addEventListener("click", select_gallery_item);
    gallery_item_element.addEventListener("keydown", (keyboard_event) => {
      if (keyboard_event.key === "Enter" || keyboard_event.key === " ") {
        keyboard_event.preventDefault();
        select_gallery_item();
      }
    });
  });

  return story_element;
}

export default {
  title: "Atoms/Icon",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    icon_name: { control: "select", options: ICON_FILE_NAMES },
  },
  args: {
    icon_name: ICON_NAME,
  },
};

export const default_story = {};
