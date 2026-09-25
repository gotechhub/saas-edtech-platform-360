---
name: respongo-edtech-ux-v2
description: Design, build, or review Respongo LMS/LXP web and mobile interfaces with the project design system and 21st.dev. Use for role dashboards, learning flows, admin operations, tenant branding, responsive behavior, or UI quality work in this repository.
---

# Respongo EdTech UX V2

Build role-appropriate learning software for learner, tenant admin, instructor, line manager, and platform admin surfaces. Preserve tenant isolation and server-authorized roles while improving the interface.

## Workflow

1. Read [product context](references/product-context.md) and the relevant role in [role experience](references/role-experience.md).
2. Read [design system](references/design-system.md) before adding or changing components.
3. For a new screen, locate it in [screen inventory](references/screen-inventory.md) and implement every required state.
4. When 21st tools are available, search first, inspect up to three suitable components, then adapt the selected code into the internal design system. Never paste a component into a feature route unchanged.
5. Run the checks in [quality gates](references/quality-gates.md) before calling work complete.

Use [the 21st workflow](references/21st-workflow.md) for component discovery, generation, dependency review, and stopping conditions.

## Non-negotiable constraints

- Treat preview role switching as presentation only. Authorization always comes from the server session and RLS.
- Keep learner surfaces visual and encouraging; keep operational roles dense, calm, and task-oriented.
- Use semantic tokens. Do not add raw brand colors to feature components.
- Support light, dark, reduced-motion, keyboard, 200% zoom, and 360px through 1920px layouts.
- Provide loading, loaded, empty, filtered-empty, error, forbidden, offline, and stale states for data screens.
- Do not send customer data, personal data, credentials, private source, or proprietary learning content to 21st.dev.
- Do not publish Respongo components, themes, screenshots, or prompts externally without explicit user authorization.

