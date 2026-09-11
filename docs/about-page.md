# About Me Page

## Web development skills

The About page includes a reusable **Skills profile** content block, placed after
the introduction and numeric values. It uses repeatable **Technology skill**
Paragraphs: technology, category, explanation, CV evidence and an optional decimal
confidence rating from 0.0 to 5.0. Edit and reorder these under Content → Blocks →
About web development skills. Blank ratings display “Not assessed”; zero is a
valid rating. Normal Drupal revisions, field access and cache invalidation apply.

The starter copy was checked against the live
[Alexander Ilivanov CV](https://docs.google.com/document/d/1Aec-DgzHUGDfqpIy0LocrFvPZeIqcHZ1SBIWClsj2ZY/edit)
on 10 September 2026. The CV establishes experience, not current competence.
**All initial scores are assistant-proposed draft estimates for owner review.**
The public card explicitly labels them provisional until the owner checks
“I have personally reviewed these ratings”. Do not remove that qualification
or present the scores as measured results without doing the assessment.

Drupal, frontend styling, PHP, JavaScript/jQuery, Angular, Storybook, MySQL and Git
make up the card. Angular is scoped to design-system integration, and MySQL to
relational modelling; neither description claims broad platform expertise.
Docker and Composer are supporting tools. Laravel, Symfony 2 and WordPress are
earlier experience that needs refreshing. Kafka and Redis are intentionally absent:
the owner said they do not know them. Do not equate working on a project with
independently mastering every technology in its stack.

### Review the scores through practical work

Use a small sandbox project and explain your decisions after doing the work.
For current independent confidence, try first without AI-generated solutions;
documentation is normal. Record where guidance or substantial refreshing was
needed. These checks are prompts for self-assessment, not automatic certification.

| Technology | A useful practical check |
| --- | --- |
| Drupal | Create a content type and a filtered View; add a small custom feature and explain permissions and cache invalidation. |
| HTML & CSS / SCSS | Build a responsive card from a sketch; verify semantic headings, keyboard focus and narrow-screen layout. |
| PHP | Implement and debug a validated form handler; explain types, errors, dependency injection and output escaping. |
| JavaScript / jQuery | Build an accessible interactive control with an Ajax request; handle loading, failure and event cleanup. |
| Angular | Build a small component with inputs and outputs, then integrate it into a form and explain data flow. |
| Storybook | Document a reusable component with controls and meaningful empty, error and responsive states. |
| MySQL | Model related entities, write a JOIN query, choose an index and explain its effect using EXPLAIN. |
| Git | Make a feature branch, resolve a small conflict and safely undo a commit; explain merge versus rebase. |

Scale: **1.0** basic awareness; **2.0** work with guidance; **3.0** independent
routine work; **4.0** solve complex problems; **5.0** deep expertise. Fractions
are subjective refinement only. Reduce or clear a score when the exercise exposes
a gap; previous project experience remains valuable and stays in the evidence line.

### Implementation and delivery

Enable the additive module with
`docker exec blog_jurenites_web ./vendor/bin/drush en jurenites_skills -y`, then
rebuild the theme and Drupal cache. Installation creates missing fields, starter
content and the About-only placement without rewriting existing page content.
`jurenites_skills_setup()` may be repeated without resetting authored values or
placement. Enabling is a separate deployment step; source delivery is not a
production content migration. For production, review ratings before enabling.

The source seed is `web/modules/custom/jurenites_skills/data/skills.json`; after
installation, the Drupal entities are authoritative. Storybook's
**Organisms / Skills Profile** uses the same starter data and covers provisional,
reviewed, unrated, boundary and mobile cases. Component presentation lives in
`src/slice/src/scss/organisms/_skills-profile.scss`; it has no inline sizing,
star icons, progress bars or JavaScript requirement. The level explanation is a
native keyboard-operable details element. Authored fields support translations;
the initial copy is English.

## Point-cloud bust

The About Me page will feature an artistic 3D bust made from points, not a
triangle surface. The initial capture device is the iPhone 11 front TrueDepth
camera.

### Capture contract

- Prefer Record3D for the first experiment because it can capture Face ID RGB-D
  video and export PLY point-cloud sequences.
- Test Heges as a second capture route because its PLY export can include
  per-vertex color.
- Keep the head and shoulders still while another person moves the phone slowly.
- Use diffuse, even lighting and a plain background. Avoid reflective glasses,
  moving hair, and changing facial expression.
- Capture several short takes rather than one long take.
- Preserve the original app recording locally, but move the durable working copy
  into a non-proprietary PLY file.

### Processing contract

- Crop the cloud to head, neck, and shoulders.
- Remove isolated points, background fragments, and low-confidence depth edges.
- Align and merge only the best frames; do not accumulate every noisy frame.
- Smooth positions gently without converting points into a triangle surface.
- Voxel-downsample to a stable spatial distribution.
- Produce desktop and mobile point budgets after testing. Begin evaluation around
  40,000 points for desktop and 15,000 points for mobile rather than treating
  those numbers as permanent limits.
- Normalize the bust into a local coordinate system with its origin near the base
  of the neck.
- Convert captured color into a controlled grayscale value per point. Preserve
  enough tonal range to describe facial planes without creating a photographic
  texture.

### Delivery contract

- Keep PLY as the editable point-cloud source.
- Generate a compact website-specific binary point buffer containing position
  and grayscale values. The browser format is derived, never the only copy.
- Render points through a dedicated WebGL/Three.js About Me canvas with responsive
  point size, depth testing, and restrained pointer or scroll motion.
- Lazy-load the point data near the About Me section.
- Provide a static poster image with matching framing as mandatory fallback for
  loading failure, JavaScript errors, WebGL failure, reduced-data preference, and
  print or social previews.
- The About Me text remains readable and complete without the 3D canvas.

### Privacy contract

Raw RGB-D captures and high-density facial point clouds remain private local
source material. Publish only the reduced artistic derivative required by the
website.
