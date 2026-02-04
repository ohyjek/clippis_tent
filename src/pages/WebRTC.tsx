/**
 * WebRTC.tsx - The WebRTC page
 *
 * This page is used to test the WebRTC functionality.
 */
import styles from "./WebRTC.module.css";
import { webRTCStore } from "@stores/webRTC";

export function WebRTC() {
  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <h1 class={styles.title}>{"WebRTC Testing 🖥️"}</h1>
        <p class={styles.subtitle}>{"Connection Information"}</p>
        <p class={styles.subtitle}>{`Connection State: ${webRTCStore.connectionState()}`}</p>
        <p class={styles.subtitle}>{`Local SDP: ${webRTCStore.localSdp()}`}</p>
        <p class={styles.subtitle}>{`Remote Stream: ${webRTCStore.remoteStream()}`}</p>
        <p class={styles.subtitle}>{`Remote Peer State: ${webRTCStore.remotePeerState()}`}</p>
        <button class={styles.button} onClick={() => webRTCStore.initializePeerConnection()}>
          {"Initialize Peer Connection"}
        </button>
        <button class={styles.button} onClick={() => webRTCStore.createOffer()}>
          {"Create Offer"}
        </button>
        <button
          class={styles.button}
          onClick={() => webRTCStore.setRemoteSdp(webRTCStore.localSdp() ?? "")}
        >
          {"Set Remote SDP"}
        </button>
        <button class={styles.button} onClick={() => webRTCStore.disconnect()}>
          {"Disconnect"}
        </button>
        {/* <button
          class={styles.button}
          onClick={() =>
            webRTCStore.sendPosition(
              webRTCStore.remotePeerState()?.position,
              webRTCStore.remotePeerState()?.facing
            )
          }
        >
          {"Send Position"}
        </button>
        <button
          class={styles.button}
          onClick={() => webRTCStore.sendSpeakingState(webRTCStore.remotePeerState()?.isSpeaking)}
        >
          {"Send Speaking State"}
        </button> */}
      </header>
    </div>
  );
}
