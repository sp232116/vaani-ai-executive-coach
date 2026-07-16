"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./moment.module.css";

const moments = [
  {
    id: "promotion-appraisal",
    title: "Promotion / Appraisal Pitch",
    description: "Present your impact confidently without sounding arrogant.",
    icon: "growth",
    criteria: [
      "Executive Confidence",
      "Value Positioning",
      "Leadership Presence",
    ],
  },
  {
    id: "stakeholder-update",
    title: "Leadership Stakeholder Update",
    description:
      "Communicate decisions, progress and risks with executive clarity.",
    icon: "leadership",
    criteria: [
      "Executive Clarity",
      "Decision Ownership",
      "Strategic Thinking",
    ],
  },
  {
    id: "client-pitch",
    title: "Client Pitch",
    description:
      "Build trust, credibility and urgency in every conversation.",
    icon: "handshake",
    criteria: ["Trust Building", "Value Framing", "Persuasion"],
  },
  {
    id: "difficult-conversation",
    title: "Difficult Conversation",
    description: "Deliver honest feedback with confidence and empathy.",
    icon: "conversation",
    criteria: ["Empathy", "Assertiveness", "Emotional Control"],
  },
];

function MomentIcon({ name }) {
  const paths = {
    growth: <path d="M5 18 10 13l3 3 6-7M15 9h4v4" />,
    leadership: <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 7a6 6 0 0 1 12 0M5 8H3m18 0h-2" />,
    handshake: <path d="m8 12 3 3 5-5M4 7l3-3 4 4m9-1-3-3-4 4M3 16l4 4 3-3m11-1-4 4-3-3" />,
    conversation: <path d="M5 6h14v10H9l-4 3V6Zm4 4h6m-6 3h4" />,
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
      strokeWidth="1.7"
    >
      {paths[name]}
    </svg>
  );
}

export default function MomentPage() {
  const [selectedMoment, setSelectedMoment] = useState(null);
  const router = useRouter();

  function handleCardKeyDown(event, index) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + direction + moments.length) % moments.length;
    setSelectedMoment(moments[nextIndex].id);
    document.getElementById(moments[nextIndex].id)?.focus();
  }

  return (
    <main className={styles.page}>
      <div className={styles.progress}>
        <div className={styles.progressCopy}>
          <span>Step 1 of 4</span>
          <span>Choose Your Executive Moment</span>
        </div>
        <div aria-hidden="true" className={styles.progressTrack}>
          <span className={styles.progressValue} />
        </div>
      </div>

      <div className={styles.intro}>
        <p className={styles.eyebrow}>Executive moment</p>
        <h1>What are you walking into today?</h1>
        <p className={styles.description}>
          Every important conversation demands a different communication strategy.
          Choose your upcoming moment and receive coaching tailored specifically
          for it.
        </p>
      </div>

      <div
        aria-label="Executive communication moment"
        className={styles.grid}
        role="radiogroup"
      >
        {moments.map((moment, index) => {
          const isSelected = selectedMoment === moment.id;

          return (
            <button
              aria-checked={isSelected}
              className={`${styles.card} ${isSelected ? styles.selected : ""}`}
              id={moment.id}
              key={moment.id}
              onClick={() => setSelectedMoment(moment.id)}
              onKeyDown={(event) => handleCardKeyDown(event, index)}
              role="radio"
              type="button"
            >
              <span className={styles.iconWrap}>
                <MomentIcon name={moment.icon} />
              </span>
              <span className={styles.cardContent}>
                <span className={styles.cardTitle}>{moment.title}</span>
                <span className={styles.cardDescription}>{moment.description}</span>
                <span className={styles.criteriaLabel}>You&apos;ll be evaluated on</span>
                <span className={styles.badges}>
                  {moment.criteria.map((criterion) => (
                    <span className={styles.badge} key={criterion}>
                      {criterion}
                    </span>
                  ))}
                </span>
                <span className={styles.assessment}>≈ 60 sec assessment</span>
              </span>
              <span className={styles.selectionMark} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className={styles.actions}>
        <button
          className="btn btn-primary"
          disabled={!selectedMoment}
          onClick={() => router.push("/record")}
          type="button"
        >
          Continue <span aria-hidden="true">→</span>
        </button>
        <p className={styles.estimate}>Estimated time: about 60 seconds</p>
      </div>
    </main>
  );
}
