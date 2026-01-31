# Technical Roadmap

This document outlines the technical implementation plan for Clippi's Tent, focusing on completing all audio and voice features before engaging with multiplayer.

## Current State (Phase 1 Complete)

### Spatial Audio Engine

The current implementation uses:
- **StereoPannerNode** for left/right panning based on listener-relative position
- **GainNode** for volume control with distance attenuation
- Custom calculations for directivity patterns and wall occlusion

**Features:**
- 6 directivity patterns: omnidirectional, cardioid, supercardioid, hypercardioid, figure8, hemisphere
- 3 distance models: linear, inverse, exponential
- Configurable max distance with smooth falloff
- Rear gain floor for sounds behind listener
- Wall occlusion with configurable attenuation

### Architecture

- **Reusable hooks**: `useAudioPlayback`, `useMicrophone`, `useRoomManager`, `useSpeakerManager`, `useCanvasDrawing`
- **Context-based state**: `DemoContext` composes all hooks
- **275 unit tests** covering spatial audio math, hooks, and UI components
- **19 E2E tests** for critical user flows

---

## Phase 2: Voice Integration

### 2.1 Voice Activity Detection (VAD) ⏳

**Goal:** Automatically detect when a user is speaking to enable/disable audio transmission.

**Implementation Options:**

1. **Volume-based VAD (Simple)**
   ```typescript
   // Use AnalyserNode to detect audio levels
   const analyser = audioContext.createAnalyser();
   const dataArray = new Uint8Array(analyser.frequencyBinCount);
   analyser.getByteTimeDomainData(dataArray);
   
   // Calculate RMS volume
   const rms = Math.sqrt(dataArray.reduce((sum, val) => 
     sum + Math.pow((val - 128) / 128, 2), 0) / dataArray.length);
   
   const isSpeaking = rms > threshold;
   ```

2. **Frequency-based VAD (Better)**
   - Analyze frequency spectrum to distinguish voice from background noise
   - Voice typically 80Hz - 3kHz with energy concentrated around 250-500Hz

3. **Web Speech API (Alternative)**
   - Use `SpeechRecognition` API for browser-native VAD
   - Limited browser support, may have latency

**Recommended:** Start with volume-based, add frequency analysis later.

**Tasks:**
- [ ] Create `useVoiceActivityDetection` hook
- [ ] Add VAD threshold setting to audio settings panel
- [ ] Visual indicator when speaking (speaker icon animation)
- [ ] Configurable hold time (continue "speaking" for N ms after voice stops)

### 2.2 Push-to-Talk Mode ⏳

**Goal:** Alternative to VAD where users hold a key to transmit.

**Tasks:**
- [ ] Add keyboard shortcut binding (default: Space or V)
- [ ] Add PTT toggle in settings
- [ ] Visual indicator when PTT active
- [ ] Consider mouse button binding for accessibility

### 2.3 Audio Level Meters ⏳

**Goal:** Visual feedback of audio input/output levels.

**Implementation:**
```typescript
// Create AnalyserNode for level metering
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256;
const dataArray = new Uint8Array(analyser.frequencyBinCount);

function getLevel(): number {
  analyser.getByteFrequencyData(dataArray);
  const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
  return average / 255; // 0-1 normalized
}
```

**Tasks:**
- [ ] Create `AudioLevelMeter` component
- [ ] Add to speaker properties panel
- [ ] Add to settings page for input device preview
- [ ] Color coding (green/yellow/red for levels)

---

## Phase 3: Advanced Audio (HRTF)

### 3.1 Understanding HRTF

**Head-Related Transfer Function (HRTF)** simulates how sound reaches each ear differently based on:
- Head shadow (high frequencies blocked by head)
- Pinna (outer ear) reflections
- Interaural time difference (ITD) — sound reaches closer ear first
- Interaural level difference (ILD) — sound louder in closer ear

**Current limitation:** StereoPannerNode only provides simple left/right panning. It cannot simulate:
- Sounds above/below the listener
- Front/back differentiation
- True 3D positioning

### 3.2 Migration to PannerNode

**Web Audio API's PannerNode** supports two panning models:

1. **`equalpower`** — Simple equal-power panning (similar to StereoPannerNode)
2. **`HRTF`** — Head-Related Transfer Function for 3D spatialization

**PannerNode advantages:**
- 3D positioning (X, Y, Z coordinates)
- Cone-based directivity (built-in!)
- Distance models (already implemented — linear, inverse, exponential)
- HRTF support for true 3D audio

**Migration plan:**

```typescript
// Current: StereoPannerNode
const panner = audioContext.createStereoPanner();
panner.pan.value = calculatePan(listener, source);

// New: PannerNode with HRTF
const panner = new PannerNode(audioContext, {
  panningModel: 'HRTF',
  distanceModel: 'inverse',
  refDistance: 1,
  maxDistance: 10,
  rolloffFactor: 1,
  coneInnerAngle: 360,  // or narrower for directional
  coneOuterAngle: 360,
  coneOuterGain: 0,
});

// Set 3D position (convert 2D to 3D with Z=0)
panner.positionX.value = source.position.x;
panner.positionY.value = source.position.y;
panner.positionZ.value = 0;

// Set orientation (for directivity)
panner.orientationX.value = Math.cos(source.facing);
panner.orientationY.value = Math.sin(source.facing);
panner.orientationZ.value = 0;
```

**AudioListener configuration:**
```typescript
const listener = audioContext.listener;
listener.positionX.value = listenerPos.x;
listener.positionY.value = listenerPos.y;
listener.positionZ.value = 0;

// Forward vector (facing direction)
listener.forwardX.value = Math.cos(listenerFacing);
listener.forwardY.value = Math.sin(listenerFacing);
listener.forwardZ.value = 0;

// Up vector (for 2D, always pointing out of screen)
listener.upX.value = 0;
listener.upY.value = 0;
listener.upZ.value = 1;
```

### 3.3 HRTF Implementation Tasks

**Phase 3.3.1: Core Migration**
- [ ] Create `usePannerNode` hook as alternative to current audio playback
- [ ] Map current directivity patterns to PannerNode cone angles:
  - Omnidirectional: `coneInnerAngle: 360, coneOuterAngle: 360`
  - Cardioid: `coneInnerAngle: 180, coneOuterAngle: 360, coneOuterGain: 0`
  - Supercardioid: `coneInnerAngle: 120, coneOuterAngle: 360, coneOuterGain: 0.1`
  - Hypercardioid: `coneInnerAngle: 90, coneOuterAngle: 270, coneOuterGain: 0.1`
  - Figure8: Special handling (two opposite cones)
- [ ] Update `useAudioPlayback` to use PannerNode
- [ ] Add HRTF toggle in settings (some users prefer simple stereo)

**Phase 3.3.2: AudioListener Integration**
- [ ] Create `useAudioListener` hook to manage global listener
- [ ] Update listener position/orientation when perspective changes
- [ ] Handle multiple speakers from single listener perspective

**Phase 3.3.3: Testing & Refinement**
- [ ] A/B test HRTF vs StereoPanner for user preference
- [ ] Add "audio spatialization" setting: Simple (stereo) | Advanced (HRTF)
- [ ] Ensure headphone detection/recommendation

### 3.4 Room Acoustics (Post-HRTF)

**Goal:** Simulate reverb and early reflections based on room geometry.

**Options:**

1. **ConvolverNode with impulse responses**
   - Pre-recorded room impulse responses
   - Different IRs for different room sizes/materials

2. **Algorithmic reverb**
   - Use Freeverb algorithm
   - Configure based on room size and wall materials

3. **Google Resonance Audio**
   - Advanced room acoustics with Ambisonics
   - More complex but higher quality

**Tasks (Future):**
- [ ] Research Resonance Audio SDK integration
- [ ] Create room acoustics settings panel
- [ ] Add reverb amount per room
- [ ] Add material-based absorption coefficients

### 3.5 Audio Quality Settings

**Tasks:**
- [ ] Sample rate selection (44.1kHz, 48kHz)
- [ ] Bitrate selection for voice (16kbps - 128kbps for future WebRTC)
- [ ] Audio processing toggle (echo cancellation, noise suppression, auto gain)
- [ ] Latency mode (low latency vs quality)

---

## Phase 4: Multiplayer (Future)

**Prerequisites:** All of Phase 2 and Phase 3 must be complete before multiplayer.

### 4.1 WebRTC Integration

- Peer-to-peer audio streams
- Signaling server (WebSocket) for connection coordination
- ICE/STUN/TURN for NAT traversal

### 4.2 Room Coordination

- Room creation/joining
- User list with positions
- Position synchronization (WebSocket or WebRTC DataChannel)

### 4.3 Audio Routing

- Apply spatial audio to incoming WebRTC streams
- Each remote user's audio routed through PannerNode
- Position updates drive panner parameter changes

---

## Implementation Priority

| Priority | Task | Phase | Complexity |
|----------|------|-------|------------|
| 1 | Voice Activity Detection | 2.1 | Medium |
| 2 | Audio Level Meters | 2.3 | Low |
| 3 | Push-to-Talk | 2.2 | Low |
| 4 | PannerNode Migration | 3.3.1 | High |
| 5 | AudioListener Integration | 3.3.2 | Medium |
| 6 | HRTF Toggle | 3.3.3 | Low |
| 7 | Audio Quality Settings | 3.5 | Low |
| 8 | Room Acoustics | 3.4 | High |

---

## Technical Notes

### Browser Compatibility

- **PannerNode HRTF**: Supported in all modern browsers (Chrome, Firefox, Safari, Edge)
- **AudioWorklet**: Required for custom audio processing (VAD)
- **getUserMedia**: Microphone access (already implemented)

### Performance Considerations

- HRTF is more CPU-intensive than equal-power panning
- Limit active PannerNodes (e.g., max 16 simultaneous sources)
- Use `linearRampToValueAtTime` for smooth parameter changes (already implemented)
- Consider Web Workers for audio analysis (VAD)

### Testing Strategy

- Unit tests for all new hooks
- Integration tests for audio pipeline
- Manual testing with headphones (HRTF requires headphones)
- A/B user testing for HRTF preference

---

## References

- [MDN: PannerNode](https://developer.mozilla.org/en-US/docs/Web/API/PannerNode)
- [MDN: AudioListener](https://developer.mozilla.org/en-US/docs/Web/API/AudioListener)
- [Web Audio API Specification](https://webaudio.github.io/web-audio-api/)
- [Google Resonance Audio](https://resonance-audio.github.io/resonance-audio/)
- [HRTF Basics](https://www.aes.org/e-lib/browse.cfm?elib=7859)
