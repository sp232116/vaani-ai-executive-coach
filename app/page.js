import Link from "next/link";
import styles from "./page.module.css";

const features = [
  {
    title: "Choose Your Moment",
    description:
      "Focus your preparation on the conversation that matters most right now.",
    icon: "target",
  },
  {
    title: "Practice in 60 Seconds",
    description:
      "Turn a spare minute into focused rehearsal before your meeting begins.",
    icon: "clock",
  },
  {
    title: "Receive Executive Coaching",
    description:
      "Build a clearer, more confident communication strategy for the room ahead.",
    icon: "insight",
  },
];

const audiences = ["Managers", "Founders", "Sales Leaders", "Working Professionals"];

function Icon({ name }) {
  const paths = {
    target: <path d="M12 20a8 8 0 1 0-8-8m8 4a4 4 0 1 0-4-4m4 0 7-7m-3 0h4v4" />,
    clock: <path d="M12 7v5l3 2m6-2a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z" />,
    insight: <path d="M9 18h6m-5 3h4m3.5-8.5a6.5 6.5 0 1 0-11 0c.9.9 1.5 1.9 1.7 3h7.6c.2-1.1.8-2.1 1.7-3Z" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={styles.icon}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    >
      {paths[name]}
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Executive communication practice</p>
          <h1>Executive conversations deserve better practice.</h1>
          <p className={styles.heroCopy}>
            Vaani helps professionals prepare for high-stakes conversations with
            AI-powered communication coaching before the meeting actually happens.
          </p>
          <div className={styles.heroActions}>
            <Link className="btn btn-primary" href="/moment">
              Start Practice
            </Link>
            <a className="btn btn-ghost" href="#how-it-works">
              See How It Works
            </a>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="features-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>A more focused way to prepare</p>
          <h2 id="features-heading">Practice for the moment in front of you.</h2>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <article className="card" key={feature.title}>
              <div className={styles.iconWrap}>
                <Icon name={feature.icon} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="audience-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Built for consequential conversations</p>
          <h2 id="audience-heading">Who is this for?</h2>
        </div>
        <div className={styles.audienceGrid}>
          {audiences.map((audience) => (
            <article className={styles.audienceCard} key={audience}>
              <span>{audience}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="how-it-works" aria-labelledby="process-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>A simple preparation ritual</p>
          <h2 id="process-heading">From pressure to presence in three steps.</h2>
        </div>
        <ol className={styles.processList}>
          {[
            ["01", "Choose Moment"],
            ["02", "Practice"],
            ["03", "Improve"],
          ].map(([number, step]) => (
            <li key={number}>
              <span>{number}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.bottomCta}>
        <p className={styles.eyebrow}>Your next conversation starts here</p>
        <h2>Ready for your next important conversation?</h2>
        <Link className="btn btn-secondary" href="/moment">
          Start Your Executive Practice
        </Link>
      </section>
    </main>
  );
}
