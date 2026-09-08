# Contact photograph

The complete rear-view desk photograph is placed after the form on `/contact`,
before the site footer. It uses a single image, with no cutout or animation.
The older Desk arrival block stays disabled.

Edit **Contact desk photograph** under **Content > Content blocks** to replace
the image or its alternative text. **Structure > Block layout > Jurenites theme**
controls its position and page visibility. The initial placement is restricted
to `/contact`, with Content-region weight 100; it does not appear on confirmation
pages. Setup preserves existing content and placement changes.

The `contact_photo` block type and managed image field belong to
`jurenites_contact`. The theme shares `.contact-photo` styling with
**Molecules / Contact Photo** in Storybook. The full 16:9 photograph scales to its
container without cropping and reserves its aspect ratio while lazy loading.
The photograph breaks out of the 800px readable frame to a centered maximum of
1600px; the form and heading retain their original width. On pages containing
this block, the page, header, footer and photograph share the Hero edge background
token. Intersected CSS masks fade all four edges over 100px, capped at 25% of each
axis on small images to retain a clear center. These values live under
`component.contact-photo` in the token source.

Source: `IMG_5320.heic`. The built-in imagegen edit removes noisy color casts,
screen UI and bright LEDs while retaining the person and real desk details.
The grade references `color.palette.dark-black`, `black`, `light-black`,
`dark-gray`, `gray`, `light-gray`, `pale-gray` and `white` from
`src/token/tokens.yaml`. This is photographic color grading, not exact flat-color
replacement. The original HEIC is untouched.

The lossless master and full prompt are retained in `output/contact-photo/`.
The web image is `src/public/assets/images/contact-desk-cold-v1.jpg`, copied into
the theme by `npm run build:theme`. Build before applying
`jurenites_contact_post_update_add_desk_photograph` on an installed site.
