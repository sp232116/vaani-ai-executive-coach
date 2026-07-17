"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { validateAnalysisResponse } from "@/lib/analysisSchema";
import styles from "./results.module.css";

const analysisResultKey = "vaani-analysis-result";
const analysisErrorKey = "vaani-analysis-error";
export default function ResultsPage() {
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedError = window.sessionStorage.getItem(analysisErrorKey);
    const savedResult = window.sessionStorage.getItem(analysisResultKey);

    if (savedError) {
      setError(savedError);
      return;
    }

    if (!savedResult) {
      setError("No completed analysis is available for this session.");
      return;
    }

    try {
      const result = JSON.parse(savedResult);

      if (!validateAnalysisResponse(result).valid) {
        throw new Error("The analysis response did not match the Vaani report schema.");
      }

      setAnalysis(result);
    } catch (responseError) {
      setError(
        responseError instanceof Error
          ? responseError.message
          : "The analysis response could not be read.",
      );
    }
  }, []);

  if (!analysis && !error) {
    return (
      <main className={styles.page} aria-busy="true">
        <header className={styles.header}>
          <p className={styles.eyebrow}>Practice report</p>
          <h1>Loading your Executive Coaching Report</h1>
        </header>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Practice report</p>
          <h1>Your Executive Coaching Report is unavailable</h1>
          <p>{error}</p>
        </header>
        <footer className={styles.actions}>
          <Link className="btn btn-primary" href="/record">Return to Practice</Link>
          <Link className="btn btn-ghost" href="/">Back to Home</Link>
        </footer>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.progress}>
          <div className={styles.progressCopy}>
            <span>Step 5 of 5</span>
            <span>Executive Coaching Report</span>
          </div>
          <div aria-hidden="true" className={styles.progressTrack}>
            <span />
          </div>
        </div>
        <p className={styles.eyebrow}>Practice report</p>
        <h1>Executive Coaching Report</h1>
      </header>

      <section className={styles.heroCard} aria-labelledby="readiness-title">
        <div>
          <p className={styles.eyebrow}>Overall Executive Readiness</p>
          <h2 id="readiness-title">{analysis.overall_score}<span>/100</span></h2>
        </div>
        <span className={styles.statusBadge}>{analysis.executive_readiness.label}</span>
      </section>

      <section className={styles.section} aria-labelledby="breakdown-title">
        <div className={styles.sectionHeading}>
          <p>{analysis.executive_readiness.summary}</p>
          <h2 id="breakdown-title">Score Breakdown</h2>
        </div>
        <div className={styles.scoreList}>
          {analysis.score_breakdown.map((item) => (
            <div className={styles.scoreRow} key={item.criterion}>
              <div>
                <span>{item.criterion}</span>
                <strong>{item.score}</strong>
              </div>
              <div
                aria-label={`${item.criterion}: ${item.score} out of 100`}
                aria-valuemax="100"
                aria-valuemin="0"
                aria-valuenow={item.score}
                className={styles.scoreTrack}
                role="progressbar"
              >
                <span style={{ width: `${item.score}%` }} />
              </div>
              <p>{item.rationale}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="strengths-title">
        <div className={styles.sectionHeading}>
          <h2 id="strengths-title">Top Strengths</h2>
        </div>
        <div className={styles.cardGrid}>
          {analysis.strengths.map((strength, index) => (
            <article className="card" key={strength.title}>
              <span className={styles.cardNumber}>{String(index + 1).padStart(2, "0")}</span>
              <h3>{strength.title}</h3>
              <p>{strength.evidence}</p>
              <p>{strength.impact}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="opportunities-title">
        <div className={styles.sectionHeading}>
          <h2 id="opportunities-title">Growth Opportunities</h2>
        </div>
        <div className={styles.cardGrid}>
          {analysis.growth_opportunities.map((opportunity, index) => (
            <article className={styles.opportunityCard} key={opportunity.title}>
              <span className={styles.cardNumber}>{String(index + 1).padStart(2, "0")}</span>
              <p>{opportunity.title}</p>
              <p>{opportunity.guidance}</p>
              <p>{opportunity.priority}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.rewrite} aria-labelledby="rewrite-title">
        <p className={styles.eyebrow}>Executive Rewrite</p>
        <h2 id="rewrite-title">{analysis.executive_rewrite.title}</h2>
        <div className={styles.rewriteGrid}>
          <article>
            <span>Before</span>
            <p>{analysis.executive_rewrite.before}</p>
          </article>
          <article>
            <span>After</span>
            <p>{analysis.executive_rewrite.after}</p>
          </article>
        </div>
        <p>{analysis.executive_rewrite.note}</p>
        <div>
          <h3>Practice Plan</h3>
          <p>{analysis.practice_plan.next_focus}</p>
          <p>{analysis.practice_plan.exercise}</p>
          <p>{analysis.practice_plan.success_measure}</p>
        </div>
      </section>

      <footer className={styles.actions}>
        <Link className="btn btn-primary" href="/moment">Practice Again</Link>
        <Link className="btn btn-ghost" href="/">Back to Home</Link>
      </footer>
    </main>
  );
}
