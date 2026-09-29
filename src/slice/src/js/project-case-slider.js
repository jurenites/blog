import { CHEVRON_ICON_SVG } from '../../../../generated/icons/control-icons.js';
import { update_square_pagination } from './square-pagination.js';

const SLIDER_INSTANCES = new WeakSet();

export function initialize_project_case_sliders(page_context = document) {
  page_context.querySelectorAll('[data-project-slider]').forEach(slider_element => {
    if (SLIDER_INSTANCES.has(slider_element)) return;
    const track_element = slider_element.querySelector('[data-project-track]');
    const slide_elements = [...track_element.querySelectorAll('[data-project-slide]')];
    if (!slide_elements.length) return;
    const pagination_element = slider_element.querySelector('[data-project-controls]');
    pagination_element.className = 'square-pagination project-case-slider__pagination';
    pagination_element.setAttribute('role', 'group');
    pagination_element.setAttribute('aria-label', window.Drupal?.t('Project pagination') || 'Project pagination');
    const dot_elements = slide_elements.map((slide_element, slide_index) => {
      const dot_element = document.createElement('button');
      dot_element.type = 'button';
      dot_element.className = 'crossfade-dot square-pagination__dot';
      const project_heading = slide_element.querySelector('h2')?.textContent.trim() || String(slide_index + 1);
      dot_element.setAttribute('aria-label', window.Drupal?.t('Show project @project', { '@project': project_heading }) || `Show project ${project_heading}`);
      dot_element.addEventListener('click', () => show_slide(slide_index));
      return dot_element;
    });
    pagination_element.replaceChildren(...dot_elements);
    const motion_query = matchMedia('(prefers-reduced-motion: reduce)');
    let current_index = 0;
    function show_slide(next_index) {
      current_index = (next_index + slide_elements.length) % slide_elements.length;
      track_element.scrollTo({ left: current_index * track_element.clientWidth, behavior: motion_query.matches ? 'instant' : 'smooth' });
    }
    for (const [direction_name, direction_step] of [['previous', -1], ['next', 1]]) {
      const control_button = document.createElement('button');
      control_button.type = 'button';
      control_button.className = `button button--ghost project-case-slider__arrow project-case-slider__arrow--${direction_name}`;
      control_button.setAttribute('aria-label', direction_step < 0
        ? (window.Drupal?.t('Previous project') || 'Previous project')
        : (window.Drupal?.t('Next project') || 'Next project'));
      control_button.hidden = slide_elements.length < 2;
      const control_icon = document.createElement('span');
      control_icon.className = 'icon project-case-slider__arrow-icon';
      control_icon.setAttribute('aria-hidden', 'true');
      control_icon.innerHTML = CHEVRON_ICON_SVG;
      control_button.append(control_icon);
      control_button.addEventListener('click', () => show_slide(current_index + direction_step));
      slider_element.append(control_button);
    }
    pagination_element.hidden = slide_elements.length < 2;
    update_square_pagination(dot_elements, current_index);
    track_element.addEventListener('scroll', () => {
      current_index = Math.round(track_element.scrollLeft / track_element.clientWidth);
      update_square_pagination(dot_elements, current_index);
    }, { passive: true });
    track_element.addEventListener('keydown', keyboard_event => {
      if (keyboard_event.target !== track_element) return;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(keyboard_event.key)) return;
      keyboard_event.preventDefault();
      show_slide(keyboard_event.key === 'Home' ? 0 : keyboard_event.key === 'End' ? slide_elements.length - 1 : current_index + (keyboard_event.key === 'ArrowLeft' ? -1 : 1));
    });
    SLIDER_INSTANCES.add(slider_element);
  });
}
