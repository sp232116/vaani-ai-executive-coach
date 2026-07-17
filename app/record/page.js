"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startAnalysisRequest } from "@/lib/analysisSession";
import styles from "./record.module.css";

const storageKey = "vaani-executive-context";
const momentStorageKey = "vaani-selected-executive-moment";
const maxAudioSize = 25 * 1024 * 1024;
const supportedAudioExtensions = ["mp3", "wav", "m4a", "webm"];

const momentGuidance = {
  "promotion-appraisal": {
    title: "Promotion / Appraisal Pitch",
    reminders: ["Lead with impact.", "Quantify achievements.", "End with your ask."],
  },
  "stakeholder-update": {
    title: "Leadership Stakeholder Update",
    reminders: [
      "Start with the outcome.",
      "State decisions clearly.",
      "Mention risks briefly.",
    ],
  },
  "client-pitch": {
    title: "Client Pitch",
    reminders: [
      "Build trust first.",
      "Talk business outcomes.",
      "Finish with one clear CTA.",
    ],
  },
  "difficult-conversation": {
    title: "Difficult Conversation",
    reminders: [
      "Lead with the issue directly.",
      "Balance clarity with empathy.",
      "End with an agreed next step.",
    ],
  },
};

const conversationToMoment = {
  "Promotion Discussion": "promotion-appraisal",
  "Leadership Update": "stakeholder-update",
  "Client Meeting": "client-pitch",
  "Performance Review": "promotion-appraisal",
};

const emptyContext = {
  conversationType: "",
  audience: "",
  desiredOutcome: "",
  worries: [],
};

function normalizeContext(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyContext;
  }

  return {
    conversationType:
      typeof value.conversationType === "string" ? value.conversationType : "",
    audience: typeof value.audience === "string" ? value.audience : "",
    desiredOutcome:
      typeof value.desiredOutcome === "string" ? value.desiredOutcome : "",
    worries: Array.isArray(value.worries)
      ? value.worries.filter((worry) => typeof worry === "string")
      : [],
  };
}

function MicrophoneIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <rect height="11" rx="4" width="7" x="8.5" y="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21m-3 0h6" strokeLinecap="round" />
    </svg>
  );
}

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getRecordingFormat() {
  if (MediaRecorder.isTypeSupported?.("audio/webm;codecs=opus")) {
    return { mimeType: "audio/webm;codecs=opus", extension: "webm" };
  }

  if (MediaRecorder.isTypeSupported?.("audio/mp4")) {
    return { mimeType: "audio/mp4", extension: "m4a" };
  }

  return null;
}

export default function RecordPage() {
  const [context, setContext] = useState(emptyContext);
  const [selectedMoment, setSelectedMoment] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [audioDuration, setAudioDuration] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingState, setRecordingState] = useState("idle");
  const [countdown, setCountdown] = useState(3);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [recordingError, setRecordingError] = useState("");
  const [recordingPreviewUrl, setRecordingPreviewUrl] = useState("");
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const countdownTimerRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const previewUrlRef = useRef("");
  const recordingFailedRef = useRef(false);
  const isMountedRef = useRef(true);
  const router = useRouter();

  function clearCountdownTimer() {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }

  function clearRecordingTimer() {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }

  function stopMicrophoneStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function clearRecordingPreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    setRecordingPreviewUrl("");
  }

  useEffect(() => {
    const savedContext = window.localStorage.getItem(storageKey);

    if (savedContext) {
      try {
        setContext(normalizeContext(JSON.parse(savedContext)));
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    setSelectedMoment(window.localStorage.getItem(momentStorageKey) || "");

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      clearCountdownTimer();
      clearRecordingTimer();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      stopMicrophoneStream();
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedAudio) {
      setAudioDuration("");
      return undefined;
    }

    const audioUrl = URL.createObjectURL(selectedAudio);
    const audio = document.createElement("audio");
    let isCurrent = true;

    audio.preload = "metadata";
    audio.src = audioUrl;
    audio.onloadedmetadata = () => {
      if (isCurrent && Number.isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(formatDuration(audio.duration));
      }
    };
    audio.onerror = () => {
      if (isCurrent) {
        setAudioDuration("");
      }
    };

    return () => {
      isCurrent = false;
      URL.revokeObjectURL(audioUrl);
    };
  }, [selectedAudio]);

  function handleAudioSelection(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!supportedAudioExtensions.includes(extension)) {
      setSelectedAudio(null);
      setUploadError("Choose an MP3, WAV, M4A, or WebM audio file.");
      return;
    }

    if (file.size > maxAudioSize) {
      setSelectedAudio(null);
      setUploadError("Choose an audio file smaller than 25 MB.");
      return;
    }

    clearRecordingPreview();
    setRecordingState("idle");
    setRecordingError("");
    setUploadError("");
    setSelectedAudio(file);
  }

  function finishRecording() {
    clearRecordingTimer();
    const recorder = mediaRecorderRef.current;

    if (recorder?.state === "recording") {
      recorder.stop();
    } else {
      stopMicrophoneStream();
      setRecordingState("idle");
    }
  }

  function beginRecording(stream) {
    const recordingFormat = getRecordingFormat();
    let recorder;

    if (!recordingFormat) {
      stopMicrophoneStream();
      setRecordingState("error");
      setRecordingError("This browser cannot create a compatible audio recording. Upload an audio file instead.");
      return;
    }

    try {
      recorder = new MediaRecorder(stream, { mimeType: recordingFormat.mimeType });
    } catch {
      stopMicrophoneStream();
      setRecordingState("error");
      setRecordingError("Your browser could not start an audio recording. Try uploading an audio file instead.");
      return;
    }

    chunksRef.current = [];
    recordingFailedRef.current = false;
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onerror = () => {
      recordingFailedRef.current = true;
      clearRecordingTimer();
      stopMicrophoneStream();
      setRecordingState("error");
      setRecordingError("Recording stopped unexpectedly. Please try again or upload an audio file.");
    };
    recorder.onstop = () => {
      clearRecordingTimer();
      stopMicrophoneStream();
      mediaRecorderRef.current = null;

      if (!isMountedRef.current || recordingFailedRef.current) {
        chunksRef.current = [];
        return;
      }

      const recordingBlob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });

      if (!recordingBlob.size) {
        setRecordingState("error");
        setRecordingError("No audio was captured. Please try recording again.");
        return;
      }

      const recordedFile = new File(
        [recordingBlob],
        `vaani-practice-${Date.now()}.${recordingFormat.extension}`,
        { type: recordingBlob.type || recordingFormat.mimeType },
      );
      const previewUrl = URL.createObjectURL(recordedFile);

      clearRecordingPreview();
      previewUrlRef.current = previewUrl;
      setRecordingPreviewUrl(previewUrl);
      setSelectedAudio(recordedFile);
      setUploadError("");
      setRecordingError("");
      setRecordingState("ready");
    };

    recorder.start();
    setSecondsRemaining(60);
    setRecordingState("recording");
    let remaining = 60;
    recordingTimerRef.current = window.setInterval(() => {
      remaining -= 1;
      setSecondsRemaining(remaining);

      if (remaining <= 0) finishRecording();
    }, 1000);
  }

  async function startRecording() {
    if (recordingState === "recording") {
      finishRecording();
      return;
    }

    if (recordingState === "countdown") {
      clearCountdownTimer();
      stopMicrophoneStream();
      setRecordingState("idle");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecordingState("error");
      setRecordingError("Recording is not supported in this browser. Upload an audio file instead.");
      return;
    }

    clearRecordingPreview();
    setSelectedAudio(null);
    setAudioDuration("");
    setUploadError("");
    setRecordingError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setCountdown(3);
      setRecordingState("countdown");
      let remaining = 3;

      countdownTimerRef.current = window.setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          setCountdown(remaining);
          return;
        }

        clearCountdownTimer();
        beginRecording(stream);
      }, 1000);
    } catch (error) {
      const isDenied = error instanceof DOMException && error.name === "NotAllowedError";
      setRecordingState("error");
      setRecordingError(
        isDenied
          ? "Microphone access was denied. Allow microphone access in your browser settings, then try again."
          : "We could not access your microphone. Check your device and try again, or upload an audio file.",
      );
    }
  }

  function handleRecordAgain() {
    clearRecordingPreview();
    setSelectedAudio(null);
    setAudioDuration("");
    setRecordingError("");
    setRecordingState("idle");
    setSecondsRemaining(60);
  }

  function handleAnalysis() {
    if (!selectedAudio || isAnalyzing) return;

    setIsAnalyzing(true);
    startAnalysisRequest({
      audio: selectedAudio,
      context: {
        selectedMoment,
        conversationType: context.conversationType,
        audience: context.audience,
        desiredOutcome: context.desiredOutcome,
        worries: context.worries,
      },
    });
    router.push("/analyzing");
  }

  const guidance = momentGuidance[selectedMoment] ?? momentGuidance[conversationToMoment[context.conversationType]] ?? {
    title: "No executive moment selected",
    reminders: [
      "Choose an executive moment before recording.",
      "Add your conversation context for tailored coaching.",
      "Return when you are ready to practice.",
    ],
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.progress}>
          <div className={styles.progressCopy}>
            <span>Step 3 of 5</span>
            <span>Practice Your Conversation</span>
          </div>
          <div aria-hidden="true" className={styles.progressTrack}>
            <span />
          </div>
        </div>
        <p className={styles.eyebrow}>Executive practice room</p>
        <h1>Practice Your Conversation</h1>
      </header>

      <section className={styles.briefing} aria-labelledby="briefing-title">
        <div className={styles.briefingHeading}>
          <p className={styles.eyebrow}>Your executive briefing</p>
          <h2 id="briefing-title">{isLoaded ? guidance.title : "Loading your context…"}</h2>
        </div>
        <dl>
          <div>
            <dt>Conversation Type</dt>
            <dd>{isLoaded ? context.conversationType || "Not provided" : "—"}</dd>
          </div>
          <div>
            <dt>Audience</dt>
            <dd>{isLoaded ? context.audience || "Not provided" : "—"}</dd>
          </div>
          <div className={styles.outcome}>
            <dt>Desired Outcome</dt>
            <dd>{isLoaded ? context.desiredOutcome || "Not provided" : "—"}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.reminders} aria-labelledby="reminders-title">
        <div>
          <p className={styles.eyebrow}>Before you begin</p>
          <h2 id="reminders-title">Three things to remember.</h2>
        </div>
        <ol>
          {guidance.reminders.map((reminder, index) => (
            <li key={reminder}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{reminder}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.practiceRoom} aria-labelledby="practice-title">
        <div className={styles.practiceHeading}>
          <div>
            <p className={styles.eyebrow}>60-second practice</p>
            <h2 id="practice-title">Take the floor.</h2>
          </div>
          <span className={styles.timer} aria-label={`${secondsRemaining} seconds remaining`}>
            {formatDuration(secondsRemaining)}
          </span>
        </div>

        <div className={styles.recorder}>
          <p className={styles.countdown} aria-live="assertive">
            {recordingState === "countdown" ? countdown : "3 · 2 · 1"}
          </p>
          <button
            aria-label={recordingState === "recording" ? "Stop recording" : recordingState === "countdown" ? "Cancel recording countdown" : "Start recording"}
            className={styles.microphone}
            disabled={isAnalyzing}
            onClick={startRecording}
            type="button"
          >
            <MicrophoneIcon />
          </button>
          <p className={styles.status} aria-live="polite">
            {recordingState === "countdown" && `Starting in ${countdown}`}
            {recordingState === "recording" && "Recording live — tap the microphone to stop"}
            {recordingState === "ready" && "Your recording is ready"}
            {(recordingState === "idle" || recordingState === "error") && "Ready when you are"}
          </p>
          <div className={styles.waveform} aria-label="Animated waveform placeholder" role="img">
            {[20, 34, 52, 32, 65, 42, 76, 48, 28, 58, 38, 66, 31, 51, 24].map((height, index) => (
              <span key={`${height}-${index}`} style={{ height: `${height}%` }} />
            ))}
          </div>
          <p className={styles.placeholderNote}>
            You have 60 seconds. Deliver the most important part of what you would say in the real conversation. Focus on your opening, key message, and desired outcome.
          </p>
          {recordingState === "recording" && (
            <button className={styles.stopButton} onClick={finishRecording} type="button">
              Stop recording
            </button>
          )}
          {recordingError && <p className={styles.recordingError} role="alert">{recordingError}</p>}
          {recordingPreviewUrl && recordingState === "ready" && (
            <div className={styles.recordingReady}>
              <audio controls src={recordingPreviewUrl}>Your browser does not support audio playback.</audio>
              <button className="btn btn-ghost" onClick={handleRecordAgain} type="button">Record Again</button>
            </div>
          )}
        </div>
      </section>

      <section className={styles.alternative} aria-labelledby="upload-title">
        <div>
          <p className={styles.eyebrow}>Alternative</p>
          <h2 id="upload-title">Upload Audio</h2>
          <p>Use a response you have already recorded.</p>
        </div>
        <div className={styles.uploadControls}>
          <label className={styles.uploadButton}>
            <input
              accept=".mp3,.wav,.m4a,.webm,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/webm"
              aria-describedby="audio-upload-help audio-upload-error"
              className={styles.fileInput}
              disabled={recordingState === "countdown" || recordingState === "recording"}
              onChange={handleAudioSelection}
              type="file"
            />
            Choose audio file
          </label>
          <p id="audio-upload-help">MP3, WAV, M4A, or WebM · 25 MB maximum</p>
          {uploadError && (
            <p className={styles.uploadError} id="audio-upload-error" role="alert">
              {uploadError}
            </p>
          )}
          {selectedAudio && (
            <div className={styles.fileDetails} role="status">
              <strong>{selectedAudio.name}</strong>
              <span>{audioDuration ? `Duration: ${audioDuration}` : "Duration unavailable"}</span>
            </div>
          )}
        </div>
      </section>

      <nav className={styles.navigation} aria-label="Practice navigation">
        <Link className="btn btn-ghost" href="/context">Back</Link>
        <button
          className="btn btn-primary"
          disabled={!selectedAudio || isAnalyzing || recordingState === "countdown" || recordingState === "recording"}
          onClick={handleAnalysis}
          type="button"
        >
          Continue to Analysis
        </button>
      </nav>
    </main>
  );
}
