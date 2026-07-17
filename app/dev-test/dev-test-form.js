"use client";

import { useState } from "react";

function worriesToJson(value) {
  return JSON.stringify(
    value
      .split("\n")
      .map((worry) => worry.trim())
      .filter(Boolean),
  );
}

export default function DevTestForm() {
  const [audioFile, setAudioFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [responseBody, setResponseBody] = useState("");
  const [requestError, setRequestError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!audioFile) {
      setRequestError("Choose an audio file before submitting.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set("audio", audioFile);
    formData.set("worries", worriesToJson(formData.get("worries") || ""));

    setStatus(null);
    setResponseTime(null);
    setResponseBody("");
    setRequestError("");

    const startedAt = performance.now();

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      setStatus(response.status);
      setResponseBody(await response.text());
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "The request could not be completed.",
      );
    } finally {
      setResponseTime(Math.round(performance.now() - startedAt));
    }
  }

  return (
    <main>
      <h1>Vaani API Developer Test</h1>
      <p>Development-only utility for manually testing the audio analysis endpoint.</p>

      <form onSubmit={handleSubmit}>
        <p>
          <label>
            Audio file
            <input
              accept=".mp3,.wav,.m4a,.webm,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/webm"
              onChange={(event) => setAudioFile(event.target.files?.[0] || null)}
              required
              type="file"
            />
          </label>
        </p>
        <p>
          <label>
            Executive moment
            <input name="selected_executive_moment" required type="text" />
          </label>
        </p>
        <p>
          <label>
            Conversation type
            <input name="conversation_type" required type="text" />
          </label>
        </p>
        <p>
          <label>
            Audience
            <input name="audience" required type="text" />
          </label>
        </p>
        <p>
          <label>
            Desired outcome
            <textarea name="desired_outcome" required rows="4" />
          </label>
        </p>
        <p>
          <label>
            Worries (one per line)
            <textarea name="worries" rows="4" />
          </label>
        </p>
        <button type="submit">Send to /api/analyze</button>
      </form>

      {requestError && <p role="alert">Request error: {requestError}</p>}

      {(status !== null || responseTime !== null || responseBody) && (
        <section aria-labelledby="response-title">
          <h2 id="response-title">Response</h2>
          <p>HTTP status: {status ?? "No response"}</p>
          <p>Response time: {responseTime ?? "—"} ms</p>
          <pre>{responseBody}</pre>
        </section>
      )}
    </main>
  );
}
