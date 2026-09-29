export function update_square_pagination(dot_elements, current_index) {
  const page_count = dot_elements.length;
  const first_index = Math.max(0, Math.min(current_index - 4, page_count - 9));
  dot_elements.forEach((dot_element, dot_index) => {
    dot_element.hidden = page_count > 10 && (dot_index < first_index || dot_index >= first_index + 9);
    dot_element.dataset.dotDistance = String(Math.min(4, Math.abs(dot_index - current_index)));
    dot_element.classList.toggle('is-active', dot_index === current_index);
    dot_element.setAttribute('aria-pressed', String(dot_index === current_index));
  });
}
