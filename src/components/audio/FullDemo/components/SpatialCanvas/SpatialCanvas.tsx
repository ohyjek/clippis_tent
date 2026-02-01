/**
 * SpatialCanvas.tsx - Main canvas area for the spatial audio demo
 *
 * Contains the interactive area where users can:
 * - Draw rooms by clicking and dragging
 * - Position and rotate speakers (all entities are speakers)
 * - Switch perspective (who you are)
 */
import { Show, For } from "solid-js";
import { Speaker } from "@components/ui";
import { useDemoContext } from "@components/audio/FullDemo/context";
import { toPercent } from "@components/audio/FullDemo/utils";
import { DrawingPreview } from "@components/audio/FullDemo/components/SpatialCanvas/DrawingPreview";
import { RoomRenderer } from "@components/audio/FullDemo/components/SpatialCanvas/RoomRenderer";
import { SoundPaths } from "@components/audio/FullDemo/components/SpatialCanvas/SoundPaths";
import styles from "./SpatialCanvas.module.css";

export function SpatialCanvas() {
  const {
    // Room state
    rooms,
    selectedRoomId,
    drawingMode,
    handleRoomClick,

    // Drawing state
    isDrawing,
    drawStart,
    drawEnd,

    // Speaker state (all entities are speakers)
    speakers,
    selectedSpeaker,
    setSelectedSpeaker,

    // Perspective state
    isCurrentPerspective,
    setCurrentPerspective,
    getPerspectivePosition,

    // Interaction state
    isMovingSpeaker,
    isRotatingSpeaker,

    // Computed values
    calculateDisplayGain,
    getWallCount,
    isPlaying,

    // Visual settings
    showSoundPaths,

    // Handlers
    handleSpeakerMoveStart,
    handleSpeakerRotateStart,
    handleCanvasClick,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    togglePlayback,

    // Room ref
    setRoomRef,
  } = useDemoContext();

  // Double-click to switch perspective
  const handleSpeakerDoubleClick = (speakerId: string) => {
    setCurrentPerspective(speakerId);
  };

  // Get icon for speaker: headphones for current perspective, microphone for others
  const getSpeakerIcon = (speakerId: string) => (isCurrentPerspective(speakerId) ? "🎧" : "🎤");

  return (
    <div
      class={`${styles.canvas} ${drawingMode() === "select" ? styles.selectMode : ""}`}
      ref={setRoomRef}
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
    >
      {/* Grid overlay */}
      <div class={styles.gridOverlay} />

      {/* Drawing preview */}
      <Show when={isDrawing() && drawStart()}>
        <DrawingPreview start={drawStart} end={drawEnd} />
      </Show>

      {/* Room boundaries */}
      <RoomRenderer
        rooms={rooms()}
        selectedRoomId={selectedRoomId()}
        drawingMode={drawingMode()}
        onRoomClick={handleRoomClick}
      />

      {/* Sound path lines - from current perspective to other speakers */}
      <Show when={showSoundPaths()}>
        <SoundPaths
          speakers={speakers().filter((s) => !isCurrentPerspective(s.id))}
          listenerPos={getPerspectivePosition()}
          selectedSpeakerId={selectedSpeaker()}
          getWallCount={getWallCount}
        />
      </Show>

      {/* All speakers (including observer) */}
      <For each={speakers()}>
        {(speaker) => (
          <div
            class={`${styles.entityWrapper} ${isCurrentPerspective(speaker.id) ? styles.currentPerspective : ""}`}
            onDblClick={() => handleSpeakerDoubleClick(speaker.id)}
            title={
              isCurrentPerspective(speaker.id)
                ? "You (current perspective)"
                : "Double-click to become this speaker"
            }
            style={{
              left: `${toPercent(speaker.position.x)}%`,
              top: `${toPercent(speaker.position.y)}%`,
            }}
          >
            <Speaker
              id={speaker.id}
              position={speaker.position}
              color={speaker.color}
              facing={speaker.facing}
              gain={isCurrentPerspective(speaker.id) ? 1 : calculateDisplayGain(speaker)}
              isSelected={selectedSpeaker() === speaker.id}
              isPlaying={isPlaying(speaker.id)}
              isMoving={isMovingSpeaker() === speaker.id}
              isRotating={isRotatingSpeaker() === speaker.id}
              icon={getSpeakerIcon(speaker.id)}
              onClick={() => {
                setSelectedSpeaker(speaker.id);
                togglePlayback(speaker.id);
              }}
              onMoveStart={handleSpeakerMoveStart(speaker.id)}
              onRotateStart={handleSpeakerRotateStart(speaker.id)}
              label={isCurrentPerspective(speaker.id) ? "YOU" : undefined}
            />
          </div>
        )}
      </For>
    </div>
  );
}
