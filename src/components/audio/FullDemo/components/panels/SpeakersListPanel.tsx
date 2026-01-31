/**
 * SpeakersListPanel.tsx - Panel listing all speakers
 *
 * Shows each speaker with its note/frequency and playing status.
 */
import { Panel, ItemList } from "@/components/ui";
import { useDemoContext } from "../../context";
import { getNoteName } from "../../utils";

export function SpeakersListPanel() {
  const { speakers, selectedSpeaker, setSelectedSpeaker, isPlaying } = useDemoContext();

  const items = () =>
    speakers().map((speaker) => ({
      id: speaker.id,
      label: `${getNoteName(speaker.frequency)} (${speaker.frequency} Hz)`,
      color: speaker.color,
      icon: isPlaying(speaker.id) ? "🔊" : undefined,
    }));

  return (
    <Panel title="Speakers" icon="🎤">
      <ItemList
        items={items()}
        selected={selectedSpeaker()}
        onSelect={setSelectedSpeaker}
        label="Speaker list"
      />
    </Panel>
  );
}
