import Link from "next/link";
import styles from "./results.module.css";

const scores = [
  ["Executive Clarity", 86],
  ["Leadership Presence", 79],
  ["Structure", 84],
  ["Confidence", 76],
  ["Business Impact", 81],
  ["Persuasion", 80],
];

const strengths = ["Clear articulation", "Professional tone", "Logical flow"];

const opportunities = [
  "Lead with the business outcome.",
  "Reduce filler words.",
  "Close with a stronger recommendation.",
];

export default function ResultsPage() {
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
          <h2 id="readiness-title">82<span>/100</span></h2>
        </div>
        <span className={styles.statusBadge}>Ready with Improvement Opportunities</span>
      </section>

      <section className={styles.section} aria-labelledby="breakdown-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Placeholder assessment</p>
          <h2 id="breakdown-title">Score Breakdown</h2>
        </div>
        <div className={styles.scoreList}>
          {scores.map(([label, score]) => (
            <div className={styles.scoreRow} key={label}>
              <div>
                <span>{label}</span>
                <strong>{score}</strong>
              </div>
              <div
                aria-label={`${label}: ${score} out of 100`}
                aria-valuemax="100"
                aria-valuemin="0"
                aria-valuenow={score}
                className={styles.scoreTrack}
                role="progressbar"
              >
                <span style={{ width: `${score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="strengths-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Placeholder highlights</p>
          <h2 id="strengths-title">Top Strengths</h2>
        </div>
        <div className={styles.cardGrid}>
          {strengths.map((strength, index) => (
            <article className="card" key={strength}>
              <span className={styles.cardNumber}>{String(index + 1).padStart(2, "0")}</span>
              <h3>{strength}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="opportunities-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Placeholder coaching focus</p>
          <h2 id="opportunities-title">Growth Opportunities</h2>
        </div>
        <div className={styles.cardGrid}>
          {opportunities.map((opportunity, index) => (
            <article className={styles.opportunityCard} key={opportunity}>
              <span className={styles.cardNumber}>{String(index + 1).padStart(2, "0")}</span>
              <p>{opportunity}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.rewrite} aria-labelledby="rewrite-title">
        <p className={styles.eyebrow}>Executive Rewrite</p>
        <h2 id="rewrite-title">A Stronger Opening</h2>
        <div className={styles.rewriteGrid}>
          <article>
            <span>Before</span>
            <p>“I wanted to share a few things I have been working on.”</p>
          </article>
          <article>
            <span>After</span>
            <p>“I would like to outline the impact delivered and the leadership scope I am ready to own next.”</p>
          </article>
        </div>
      </section>

      <footer className={styles.actions}>
        <Link className="btn btn-primary" href="/moment">Practice Again</Link>
        <Link className="btn btn-ghost" href="/">Back to Home</Link>
      </footer>
    </main>
  );
}
