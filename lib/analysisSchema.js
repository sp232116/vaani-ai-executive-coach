// Shared Vaani report contract validation for the API boundary and Results page.

export const analysisResponseFields = [
  "overall_score",
  "executive_readiness",
  "score_breakdown",
  "strengths",
  "growth_opportunities",
  "executive_rewrite",
  "practice_plan",
  "metadata",
];

export const momentCriteria = {
  "promotion-appraisal": [
    "Executive Confidence",
    "Value Positioning",
    "Leadership Presence",
  ],
  "stakeholder-update": [
    "Executive Clarity",
    "Decision Ownership",
    "Strategic Thinking",
  ],
  "client-pitch": ["Trust Building", "Value Framing", "Persuasion"],
  "difficult-conversation": ["Empathy", "Assertiveness", "Emotional Control"],
};

const readinessLabels = {
  needs_foundation: "Needs Foundation",
  developing: "Developing Executive Readiness",
  ready_with_opportunities: "Ready with Improvement Opportunities",
  strong_readiness: "Strong Executive Readiness",
};
const priorities = new Set(["high", "medium", "low"]);
const statuses = new Set(["complete", "insufficient_input", "failed"]);
const momentIds = new Set(Object.keys(momentCriteria));
const semanticVersion = /^\d+\.\d+(?:\.\d+)?$/;
const scoreCoherenceTolerance = 15;

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value, keys) {
  if (!isObject(value)) return false;

  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();

  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function validText(value, maximum) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximum;
}

function validScore(value) {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

function addIssue(issues, condition, message) {
  if (!condition) issues.push(message);
}

export function validateAnalysisResponse(value) {
  const issues = [];

  addIssue(issues, hasExactKeys(value, analysisResponseFields), "Top-level fields do not match the Vaani report contract.");
  if (!isObject(value)) return { valid: false, issues };

  addIssue(issues, validScore(value.overall_score), "overall_score must be an integer from 0 to 100.");

  const readiness = value.executive_readiness;
  addIssue(issues, hasExactKeys(readiness, ["level", "label", "summary"]), "executive_readiness has an invalid shape.");
  if (isObject(readiness)) {
    addIssue(issues, Object.hasOwn(readinessLabels, readiness.level), "executive_readiness.level is unsupported.");
    addIssue(issues, readiness.label === readinessLabels[readiness.level], "executive_readiness.label does not match its level.");
    addIssue(issues, validText(readiness.summary, 450), "executive_readiness.summary is invalid.");
  }

  const breakdown = value.score_breakdown;
  addIssue(issues, Array.isArray(breakdown) && breakdown.length === 3, "score_breakdown must contain exactly three items.");
  if (Array.isArray(breakdown)) {
    const criteria = new Set();
    breakdown.forEach((item, index) => {
      addIssue(issues, hasExactKeys(item, ["criterion", "score", "rationale"]), `score_breakdown[${index}] has an invalid shape.`);
      if (isObject(item)) {
        addIssue(issues, validText(item.criterion, 80), `score_breakdown[${index}].criterion is invalid.`);
        addIssue(issues, validScore(item.score), `score_breakdown[${index}].score is invalid.`);
        addIssue(issues, validText(item.rationale, 300), `score_breakdown[${index}].rationale is invalid.`);
        criteria.add(item.criterion);
      }
    });
    addIssue(issues, criteria.size === breakdown.length, "score_breakdown contains duplicate criteria.");
    const expectedCriteria = momentCriteria[value.metadata?.moment_id];
    if (expectedCriteria) {
      const matchesMomentCriteria =
        criteria.size === expectedCriteria.length &&
        expectedCriteria.every((criterion) => criteria.has(criterion));
      addIssue(issues, matchesMomentCriteria, "score_breakdown does not match the selected executive moment.");
    }
    if (breakdown.length === 3 && breakdown.every((item) => validScore(item?.score))) {
      const averageBreakdownScore = breakdown.reduce((total, item) => total + item.score, 0) / breakdown.length;
      addIssue(
        issues,
        Math.abs(value.overall_score - averageBreakdownScore) <= scoreCoherenceTolerance,
        "overall_score is materially inconsistent with the score breakdown.",
      );
    }
  }

  const strengths = value.strengths;
  addIssue(issues, Array.isArray(strengths) && strengths.length >= 2 && strengths.length <= 3, "strengths must contain two or three items.");
  if (Array.isArray(strengths)) {
    strengths.forEach((item, index) => {
      addIssue(issues, hasExactKeys(item, ["title", "evidence", "impact"]), `strengths[${index}] has an invalid shape.`);
      if (isObject(item)) {
        addIssue(issues, validText(item.title, 80), `strengths[${index}].title is invalid.`);
        addIssue(issues, validText(item.evidence, 300), `strengths[${index}].evidence is invalid.`);
        addIssue(issues, validText(item.impact, 250), `strengths[${index}].impact is invalid.`);
      }
    });
  }

  const opportunities = value.growth_opportunities;
  addIssue(issues, Array.isArray(opportunities) && opportunities.length >= 2 && opportunities.length <= 3, "growth_opportunities must contain two or three items.");
  if (Array.isArray(opportunities)) {
    opportunities.forEach((item, index) => {
      addIssue(issues, hasExactKeys(item, ["title", "guidance", "priority"]), `growth_opportunities[${index}] has an invalid shape.`);
      if (isObject(item)) {
        addIssue(issues, validText(item.title, 100), `growth_opportunities[${index}].title is invalid.`);
        addIssue(issues, validText(item.guidance, 350), `growth_opportunities[${index}].guidance is invalid.`);
        addIssue(issues, priorities.has(item.priority), `growth_opportunities[${index}].priority is unsupported.`);
      }
    });
    addIssue(issues, opportunities.some((item) => item?.priority === "high"), "growth_opportunities must include a high-priority item.");
  }

  const rewrite = value.executive_rewrite;
  addIssue(issues, hasExactKeys(rewrite, ["title", "before", "after", "note"]), "executive_rewrite has an invalid shape.");
  if (isObject(rewrite)) {
    addIssue(issues, validText(rewrite.title, 80), "executive_rewrite.title is invalid.");
    addIssue(issues, validText(rewrite.before, 500), "executive_rewrite.before is invalid.");
    addIssue(issues, validText(rewrite.after, 500), "executive_rewrite.after is invalid.");
    addIssue(issues, validText(rewrite.note, 200), "executive_rewrite.note is invalid.");
  }

  const plan = value.practice_plan;
  addIssue(issues, hasExactKeys(plan, ["next_focus", "exercise", "success_measure"]), "practice_plan has an invalid shape.");
  if (isObject(plan)) {
    addIssue(issues, validText(plan.next_focus, 200), "practice_plan.next_focus is invalid.");
    addIssue(issues, validText(plan.exercise, 350), "practice_plan.exercise is invalid.");
    addIssue(issues, validText(plan.success_measure, 250), "practice_plan.success_measure is invalid.");
  }

  const metadata = value.metadata;
  addIssue(issues, hasExactKeys(metadata, ["schema_version", "moment_id", "rubric_version", "analysis_status", "generated_at", "limitations"]), "metadata has an invalid shape.");
  if (isObject(metadata)) {
    addIssue(issues, typeof metadata.schema_version === "string" && semanticVersion.test(metadata.schema_version), "metadata.schema_version is invalid.");
    addIssue(issues, momentIds.has(metadata.moment_id), "metadata.moment_id is unsupported.");
    addIssue(issues, typeof metadata.rubric_version === "string" && semanticVersion.test(metadata.rubric_version), "metadata.rubric_version is invalid.");
    addIssue(issues, statuses.has(metadata.analysis_status), "metadata.analysis_status is unsupported.");
    addIssue(issues, typeof metadata.generated_at === "string" && !Number.isNaN(Date.parse(metadata.generated_at)), "metadata.generated_at is invalid.");
    addIssue(issues, Array.isArray(metadata.limitations) && metadata.limitations.every((item) => validText(item, 250)), "metadata.limitations is invalid.");
    addIssue(issues, metadata.analysis_status === "complete", "Only complete reports can be rendered by the current Results page.");
  }

  return { valid: issues.length === 0, issues };
}
