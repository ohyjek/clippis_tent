/**
 * Tabs.stories.tsx - Storybook stories for Tabs component
 */
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { createSignal } from "solid-js";
import { Tabs } from "./Tabs";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

const basicTabs = [
  { id: "tab1", label: "General" },
  { id: "tab2", label: "Audio" },
  { id: "tab3", label: "Advanced" },
];

const tabsWithIcons = [
  { id: "listener", label: "Listener", icon: "🎧" },
  { id: "speaker", label: "Speaker", icon: "📢" },
  { id: "room", label: "Room", icon: "🏠" },
];

export const Default: Story = {
  args: {
    tabs: basicTabs,
    activeTab: "tab1",
    onTabChange: () => undefined,
  },
};

export const WithIcons: Story = {
  args: {
    tabs: tabsWithIcons,
    activeTab: "listener",
    onTabChange: () => undefined,
  },
};

export const SecondTabActive: Story = {
  args: {
    tabs: basicTabs,
    activeTab: "tab2",
    onTabChange: () => undefined,
  },
};

export const Interactive: Story = {
  render: () => {
    const [activeTab, setActiveTab] = createSignal("listener");
    return (
      <div>
        <Tabs
          tabs={tabsWithIcons}
          activeTab={activeTab()}
          onTabChange={setActiveTab}
        />
        <div style={{
          "margin-top": "16px",
          padding: "16px",
          background: "var(--color-bg-secondary)",
          "border-radius": "8px",
        }}>
          <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
            Active tab: <strong style={{ color: "var(--color-text-primary)" }}>{activeTab()}</strong>
          </p>
        </div>
      </div>
    );
  },
};

export const ManyTabs: Story = {
  args: {
    tabs: [
      { id: "home", label: "Home" },
      { id: "profile", label: "Profile" },
      { id: "settings", label: "Settings" },
      { id: "audio", label: "Audio" },
      { id: "video", label: "Video" },
    ],
    activeTab: "home",
    onTabChange: () => undefined,
  },
};
