"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./context.module.css";

const storageKey = "vaani-executive-context";

const conversationTypes = [
  "Promotion Discussion",
  "Leadership Update",
  "Client Meeting",
  "Interview",
  "Performance Review",
  "Team Meeting",
  "Presentation",
  "Other",
];

const audiences = [
  "Manager",
  "Senior Leadership",
  "Client",
  "Recruiter",
  "Team",
  "Board",
  "Audience",
  "Other",
];

const concerns = [
  "Losing confidence",
  "Speaking too fast",
  "Finding the right words",
  "Sounding unstructured",
  "Nervousness",
  "Filler words",
  "Being misunderstood",
  "Other",
];

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

export default function ContextPage() {
  const [context, setContext] = useState(emptyContext);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedContext = window.localStorage.getItem(storageKey);

    if (savedContext) {
      try {
        setContext(normalizeContext(JSON.parse(savedContext)));
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) {
      window.localStorage.setItem(storageKey, JSON.stringify(context));
    }
  }, [context, isReady]);

  function toggleWorry(worry) {
    setContext((current) => ({
      ...current,
      worries: current.worries.includes(worry)
        ? current.worries.filter((item) => item !== worry)
        : [...current.worries, worry],
    }));
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.progress}>
          <div className={styles.progressCopy}>
            <span>Step 2 of 5</span>
            <span>Know Your Situation</span>
          </div>
          <div aria-hidden="true" className={styles.progressTrack}>
            <span />
          </div>
        </div>
        <p className={styles.eyebrow}>Executive briefing</p>
        <h1>Know Your Situation</h1>
        <p>
          Before we analyze your communication, help us understand the context.
        </p>
      </header>

      <form className={styles.form}>
        <fieldset className={styles.fieldGroup}>
          <legend>What type of conversation is this?</legend>
          <label className={styles.selectWrap}>
            <span className="sr-only">Conversation type</span>
            <select
              onChange={(event) =>
                setContext((current) => ({
                  ...current,
                  conversationType: event.target.value,
                }))
              }
              value={context.conversationType}
            >
              <option value="">Select a conversation type</option>
              {conversationTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
        </fieldset>

        <fieldset className={styles.fieldGroup}>
          <legend>Who are you speaking to?</legend>
          <label className={styles.selectWrap}>
            <span className="sr-only">Audience</span>
            <select
              onChange={(event) =>
                setContext((current) => ({ ...current, audience: event.target.value }))
              }
              value={context.audience}
            >
              <option value="">Select an audience</option>
              {audiences.map((audience) => (
                <option key={audience} value={audience}>{audience}</option>
              ))}
            </select>
          </label>
        </fieldset>

        <fieldset className={styles.fieldGroup}>
          <legend>What outcome do you want?</legend>
          <label className={styles.textareaWrap}>
            <span className="sr-only">Desired outcome</span>
            <textarea
              onChange={(event) =>
                setContext((current) => ({ ...current, desiredOutcome: event.target.value }))
              }
              placeholder={'Example:\n"I want my manager to approve my proposal."'}
              rows="4"
              value={context.desiredOutcome}
            />
          </label>
        </fieldset>

        <fieldset className={styles.fieldGroup}>
          <legend>What worries you the most?</legend>
          <div className={styles.checkboxGrid}>
            {concerns.map((concern) => (
              <label className={styles.checkbox} key={concern}>
                <input
                  checked={context.worries.includes(concern)}
                  onChange={() => toggleWorry(concern)}
                  type="checkbox"
                />
                <span>{concern}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </form>

      <nav className={styles.navigation} aria-label="Context navigation">
        <Link className="btn btn-ghost" href="/moment">Back</Link>
        <Link className="btn btn-primary" href="/record">Continue</Link>
      </nav>
    </main>
  );
}
