# 21st.dev workflow

1. Confirm the `21st` MCP is authenticated and inspect usage before generation.
2. Search with a short functional query and the intended stack, such as `accessible dense admin analytics dashboard React Tailwind`.
3. Compare up to three candidates using task fit, responsive behavior, accessibility, dependency weight, visual fit, licensing, and maintenance risk.
4. Fetch the full component and dependency metadata before selecting it.
5. Move useful patterns into `@respongo/ui-web`; replace colors, typography, spacing, icons, and copy with project tokens and domain language.
6. Add meaningful states and tests that the source component does not provide.

Use AI generation only when `get_usage` confirms it is enabled. Stop after `ai_subscription_required`; use catalog components or local implementation instead. Stop when a dependency adds disproportionate bundle size, unclear licensing, inaccessible behavior, or conflicts with server-rendered Next.js boundaries.

Never send secrets, customer data, personal data, private learning content, or proprietary source to 21st. Never publish external components or themes without explicit authorization.

