/**
 * RoomPropertiesPanel.tsx - Panel for editing selected room properties
 *
 * Allows changing room name, color, and wall attenuation.
 */
import { Show, createEffect, createSignal } from "solid-js";
import {
  Button,
  ColorSwatches,
  Panel,
  InputField,
  SliderField,
  FieldGroup,
  ButtonRow,
} from "@/components/ui";
import { useDemoContext } from "../../context";
import { ROOM_COLORS } from "../../constants";

export function RoomPropertiesPanel() {
  const {
    selectedRoom,
    updateRoomLabel,
    updateRoomColor,
    updateRoomAttenuation,
    deleteSelectedRoom,
  } = useDemoContext();

  // Local slider value to prevent race conditions when room selection changes
  const [sliderValue, setSliderValue] = createSignal(100);

  // Sync local slider value when selected room changes
  createEffect(() => {
    const room = selectedRoom();
    if (room) {
      setSliderValue(Math.round(room.attenuation * 100));
    }
  });

  const handleSliderChange = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
    const newValue = parseInt(e.currentTarget.value);
    const room = selectedRoom();
    if (!room) return;

    setSliderValue(newValue);
    // Pass the room ID explicitly to prevent race conditions when selection changes
    updateRoomAttenuation(newValue / 100, room.id);
  };

  return (
    <Show when={selectedRoom()}>
      {(room) => (
        <Panel title="Room Properties" icon="🚪">
          <InputField
            label="Name"
            value={room().label}
            onInput={(e) => updateRoomLabel(e.currentTarget.value)}
          />

          <FieldGroup label="Color">
            <ColorSwatches
              colors={ROOM_COLORS}
              selected={room().color}
              onSelect={updateRoomColor}
              label="Room color"
            />
          </FieldGroup>

          <SliderField
            label={`Wall Attenuation: ${sliderValue()}%`}
            value={sliderValue()}
            onInput={handleSliderChange}
            min={0}
            max={100}
            step={1}
            minLabel="Transparent"
            maxLabel="Solid"
            formatValue={(v) => `${v}%`}
          />

          <ButtonRow>
            <Button variant="danger" icon="🗑️" onClick={deleteSelectedRoom}>
              Delete Room
            </Button>
          </ButtonRow>
        </Panel>
      )}
    </Show>
  );
}
