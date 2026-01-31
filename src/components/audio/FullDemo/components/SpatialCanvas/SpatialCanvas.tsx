/**
 * SpatialCanvas.tsx - Main canvas area for the spatial audio demo
 *
 * Contains the interactive area where users can:
 * - Draw rooms by clicking and dragging
 * - Position and rotate speakers
 * - Move and rotate the listener
 */
import { Show, For } from "solid-js";
import { Speaker } from "@/components/ui";
import { useDemoContext } from "../../context";
import { toPercent } from "../../utils";
import { DrawingPreview } from "./DrawingPreview";
import { RoomRenderer } from "./RoomRenderer";
import { SoundPaths } from "./SoundPaths";
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

    // Listener state
    listenerPos,
    listenerFacing,

    // Speaker state
    speakers,
    selectedSpeaker,
    setSelectedSpeaker,

    // Interaction state
    isDraggingListener,
    isRotatingListener,
    isMovingSpeaker,
    isRotatingSpeaker,

    // Computed values
    calculateDisplayGain,
    getWallCount,
    isPlaying,

    // Visual settings
    showSoundPaths,

    // Handlers
    handleListenerMove,
    handleListenerRotate,
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

      {/* Sound path lines */}
      <Show when={showSoundPaths()}>
        <SoundPaths
          speakers={speakers()}
          listenerPos={listenerPos()}
          selectedSpeakerId={selectedSpeaker()}
          getWallCount={getWallCount}
        />
      </Show>

      {/* Speakers */}
      <For each={speakers()}>
        {(speaker) => (
          <Speaker
            id={speaker.id}
            position={speaker.position}
            color={speaker.color}
            facing={speaker.facing}
            gain={calculateDisplayGain(speaker)}
            isSelected={selectedSpeaker() === speaker.id}
            isPlaying={isPlaying(speaker.id)}
            isMoving={isMovingSpeaker() === speaker.id}
            isRotating={isRotatingSpeaker() === speaker.id}
            onClick={() => {
              setSelectedSpeaker(speaker.id);
              togglePlayback(speaker.id);
            }}
            onMoveStart={handleSpeakerMoveStart(speaker.id)}
            onRotateStart={handleSpeakerRotateStart(speaker.id)}
            style={{
              left: `${toPercent(speaker.position.x)}%`,
              top: `${toPercent(speaker.position.y)}%`,
            }}
          />
        )}
      </For>

      {/* Listener */}
      <Speaker
        id="listener"
        position={listenerPos()}
        color="#3b82f6"
        facing={listenerFacing()}
        gain={1}
        isSelected={false}
        isPlaying={false}
        isMoving={isDraggingListener()}
        isRotating={isRotatingListener()}
        icon="🎧"
        onMoveStart={handleListenerMove}
        onRotateStart={handleListenerRotate}
        style={{
          left: `${toPercent(listenerPos().x)}%`,
          top: `${toPercent(listenerPos().y)}%`,
        }}
      />
    </div>
  );
}
