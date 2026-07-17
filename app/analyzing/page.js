"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearPendingAnalysis,
  getPendingAnalysis,
} from "@/lib/analysisSession";
import styles from "./analyzing.module.css";

const analysisResultKey = "vaani-analysis-result";
const analysisErrorKey = "vaani-analysis-error";
const stages = [
  "Uploading recording...",
  "Transcribing conversation...",
  "Evaluating executive communication...",
  "Building personalized coaching report...",
  "Finalizing insights...",
];

export default function AnalyzingPage() {
  const [activeStage, setActiveStage] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const pendingAnalysis = getPendingAnalysis();

    if (!pendingAnalysis) {
      window.sessionStorage.setItem(
        analysisErrorKey,
        "No active analysis request is available for this session.",
      );
      router.replace("/results");
      return undefined;
    }

    let isCurrent = true;
    const stageTimer = window.setInterval(() => {
      setActiveStage((current) => (current + 1) % stages.length);
    }, 1400);

    pendingAnalysis
      .then((result) => {
        if (isCurrent) {
          window.sessionStorage.setItem(analysisResultKey, JSON.stringify(result));
          window.sessionStorage.removeItem(analysisErrorKey);
          router.replace("/results");
        }
      })
      .catch((error) => {
        if (isCurrent) {
          window.sessionStorage.setItem(
            analysisErrorKey,
            error instanceof Error ? error.message : "Analysis could not be completed.",
          );
          window.sessionStorage.removeItem(analysisResultKey);
          router.replace("/results");
        }
      })
      .finally(() => {
        clearPendingAnalysis();
      });

    return () => {
      isCurrent = false;
      window.clearInterval(stageTimer);
    };
  }, [router]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.progress}>
          <div className={styles.progressCopy}>
            <span>Step 4 of 5</span>
            <span>Analyzing Your Executive Communication</span>
          </div>
          <div aria-hidden="true" className={styles.progressTrack}>
            <span />
          </div>
        </div>
        <p className={styles.eyebrow}>Executive coaching analysis</p>
        <h1>Analyzing Your Executive Communication</h1>
        <p>
          Please wait while Vaani evaluates your communication using your
          selected executive context.
        </p>
      </header>

      <section className={styles.analysis} aria-labelledby="analysis-title">
        <h2 className="sr-only" id="analysis-title">Analysis in progress</h2>
        <p className="sr-only" aria-live="polite">{stages[activeStage]}</p>
        <div className={styles.visualization} aria-hidden="true">
          <span className={styles.outerRing} />
          <span className={styles.innerRing} />
          <span className={styles.core} />
          <span className={styles.orbitOne} />
          <span className={styles.orbitTwo} />
        </div>

        <ol className={styles.stageList} aria-label="Analysis stages">
          {stages.map((stage, index) => {
            const isActive = index === activeStage;

            return (
              <li aria-current={isActive ? "step" : undefined} className={isActive ? styles.activeStage : ""} key={stage}>
                <span className={styles.stageIndicator} aria-hidden="true"><span /></span>
                <span>{stage}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <footer className={styles.footer}>
        <p>This usually takes less than a minute.</p>
        <button className="btn btn-primary" disabled type="button">
          Continue
        </button>
      </footer>
    </main>
  );
}
