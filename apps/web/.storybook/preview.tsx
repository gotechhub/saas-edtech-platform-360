import type { Preview } from "@storybook/nextjs-vite";
import "../src/app/globals.css";
import "../src/app/v2.css";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Respongo deneyim teması",
      defaultValue: "light",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "light", title: "Açık tema" },
          { value: "dark", title: "Koyu tema" },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => (
      <div
        data-v2-theme={context.globals.theme}
        style={{ minHeight: "100vh", padding: 32, color: "var(--rv2-text)", background: "var(--rv2-bg)", fontFamily: "var(--rv2-font-sans)" }}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
    a11y: { test: "error" },
    viewport: {
      options: {
        mobile360: { name: "Mobile 360", styles: { width: "360px", height: "800px" } },
        mobile390: { name: "Mobile 390", styles: { width: "390px", height: "844px" } },
        tablet768: { name: "Tablet 768", styles: { width: "768px", height: "1024px" } },
        desktop1440: { name: "Desktop 1440", styles: { width: "1440px", height: "1000px" } },
      },
    },
  },
};

export default preview;
