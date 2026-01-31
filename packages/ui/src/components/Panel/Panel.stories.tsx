/**
 * Panel.stories.tsx - Storybook stories for Panel
 */
import { Panel } from "./Panel";

export default {
  title: "Components/Panel",
  component: Panel,
};

export const Default = () => (
  <div style={{ width: "300px" }}>
    <Panel title="Speaker Properties" icon="🎤">
      <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
        Panel content goes here
      </p>
    </Panel>
  </div>
);

export const WithoutIcon = () => (
  <div style={{ width: "300px" }}>
    <Panel title="Audio Settings">
      <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
        Settings content
      </p>
    </Panel>
  </div>
);

export const MultiplePanels = () => (
  <div style={{ width: "300px", display: "flex", flexDirection: "column", gap: "16px" }}>
    <Panel title="Properties" icon="⚙️">
      <p style={{ margin: 0, color: "var(--color-text-muted)" }}>First panel</p>
    </Panel>
    <Panel title="Items" icon="📋">
      <p style={{ margin: 0, color: "var(--color-text-muted)" }}>Second panel</p>
    </Panel>
  </div>
);
