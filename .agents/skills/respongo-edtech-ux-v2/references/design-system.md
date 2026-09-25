# Design system

- Typography: Inter Variable for interface and data; Source Serif 4 only for selective editorial headings.
- Brand: navy ink, warm neutral surfaces, restrained gold accent. Status colors are semantic and independent of tenant branding.
- Spacing: 4px base with 8px primary rhythm. Touch targets are at least 44px.
- Radius: 10px controls, 16px cards, 24px feature surfaces.
- Icons: Lucide stroke system plus audited custom SVGs using matching geometry.
- Motion: 150–220ms interface transitions, 400–700ms achievement moments, with a static reduced-motion equivalent.
- Content widths: learner reading areas stay narrow; operations tables can expand to 1920px without stretching prose.
- Responsive checks: 360, 390, 768, 1280, 1440, and 1920px.

Feature components consume semantic tokens from `@respongo/design-tokens`. Raw palette values belong only in token definitions.

