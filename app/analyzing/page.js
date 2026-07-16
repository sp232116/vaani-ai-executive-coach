import styles from "./analyzing.module.css";

const stages = [
  "Understanding your conversation context",
  "Reviewing communication structure",
  "Evaluating executive presence",
  "Measuring clarity and confidence",
  "Preparing personalized coaching",
];

export default function AnalyzingPage() {
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
        <div className={styles.visualization} aria-hidden="true">
          <span className={styles.outerRing} />
          <span className={styles.innerRing} />
          <span className={styles.core} />
          <span className={styles.orbitOne} />
          <span className={styles.orbitTwo} />
        </div>

        <ol className={styles.stageList} aria-label="Analysis stages">
          {stages.map((stage, index) => {
            const isActive = index === 0;

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
