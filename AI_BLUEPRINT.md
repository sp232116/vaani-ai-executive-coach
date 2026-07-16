# Vaani AI Experience Blueprint

## Purpose

Vaani helps a professional rehearse one high-stakes business conversation, then turns a short spoken response into clear, practical executive-coaching feedback. The AI experience should feel focused, private, and immediately useful—not like a generic chatbot.

## 1. Complete User Journey

1. **Landing page**
   - The user understands Vaani's purpose and starts a practice session.

2. **Choose executive moment**
   - The user selects one communication context: Promotion / Appraisal Pitch, Leadership Stakeholder Update, Client Pitch, or Difficult Conversation.
   - Vaani records the selected context and its evaluation criteria for the session.

3. **Record practice response**
   - Vaani presents a short, context-appropriate prompt and captures the user's spoken response.
   - The user can review and submit the recording before analysis begins.

4. **Transcribe and analyze**
   - The audio is transcribed.
   - The coaching model evaluates the transcript against the selected moment's criteria, with a consistent scoring rubric and executive-coaching tone.

5. **Review results**
   - The user receives a concise scorecard, strengths, improvement opportunities, and one immediately actionable next step.
   - The user may restart practice or select a new moment.

## 2. Data Collected at Each Step

| Step | Required data | Optional data | Purpose |
| --- | --- | --- | --- |
| Moment selection | `momentId`, moment title, evaluation criteria | Session ID | Selects the correct coaching context and rubric. |
| Recording | Audio file/blob, duration, recording format | Consent timestamp, device metadata | Creates the source material for transcription. |
| Transcription | Transcript text, language, transcription confidence | Timestamps, detected fillers | Supplies the content for coaching analysis. |
| Analysis | Selected moment, criteria, transcript, rubric version | Prior attempt ID, user goal | Produces moment-specific feedback. |
| Results | Structured feedback object, generated timestamp | User rating of feedback | Renders the scorecard and supports later iteration. |

### Privacy principles

- Collect only the audio and text necessary for the current coaching session.
- Ask for clear consent before recording or transmitting audio.
- Do not send unrelated account, contact, calendar, or employer data to the model.
- Keep audio, transcripts, and results behind authenticated access when accounts are introduced.
- Define a retention and deletion policy before production release.

## 3. Information Sent to the AI

The analysis request should contain structured, minimal context:

- `sessionId`: server-generated identifier used for tracing; never use an email address as the prompt identifier.
- `moment`: selected moment ID and title.
- `evaluationCriteria`: the three criteria associated with the selected moment.
- `transcript`: cleaned transcription text, plus the original text when confidence or interpretation matters.
- `responseDurationSeconds`: supports feedback on brevity and pacing.
- `rubricVersion`: identifies the scoring framework used.
- `instructions`: a server-owned coaching prompt that defines tone, scoring ranges, response schema, safety constraints, and the requirement to avoid invented facts.

The request should **not** include raw audio when a transcription endpoint has already produced the transcript, unless a future audio-capable evaluation has a clearly defined benefit and consent model.

## 4. What AI Should Return

The model should return validated structured data, not presentation-ready prose alone. A stable response contract should include:

| Field | Description |
| --- | --- |
| `overallScore` | Integer score on a documented scale, such as 0–100. |
| `criteriaScores` | One score and short rationale for each selected evaluation criterion. |
| `summary` | Two to three sentences describing the overall executive impact. |
| `strengths` | Two specific behaviors that worked well, grounded in the transcript. |
| `improvements` | Up to three prioritized coaching opportunities, each with a concrete suggestion. |
| `suggestedRewrite` | An optional concise example of how to improve a key sentence or opening. Clearly label it as an example, not a script to memorize. |
| `nextPracticeFocus` | One focused objective for the user's next attempt. |
| `confidenceNotes` | Any limitations caused by a short, unclear, or incomplete transcript. |

The model must avoid unsupported judgments about personality, competence, mental health, protected characteristics, or workplace outcomes. Feedback should focus on observable communication choices in the submitted response.

## 5. Results Page Content

The Results page should display the returned feedback in this order:

1. **Session context**
   - Selected executive moment and assessment duration.

2. **Overall executive readiness**
   - Overall score, clear label, and a short summary.

3. **Criteria scorecard**
   - The three moment-specific evaluation criteria with their scores and brief rationale.

4. **What worked**
   - Specific strengths based on the user’s language or structure.

5. **What to improve next**
   - Prioritized improvements with short, actionable guidance.

6. **Practice recommendation**
   - One next-practice focus and, when appropriate, an example rewrite.

7. **Session actions**
   - Practice again, choose another moment, and eventually save or share results.

The page should gracefully handle analysis failures, insufficient recordings, and low-confidence transcripts without displaying fabricated scores.

## 6. Folder and File Responsibilities

| Location | Responsibility |
| --- | --- |
| `app/moment/` | Captures the selected executive moment and starts a session. |
| `app/record/` | Hosts recording permission, capture, review, and submission UI. |
| `app/analyzing/` | Shows non-blocking analysis progress and handles transition to results. |
| `app/results/` | Renders the structured coaching response and recovery states. |
| `components/moment-selector/` | Reusable moment cards and selection interactions. |
| `components/recorder/` | Recording controls, waveform/status UI, and playback components. |
| `components/scorecard/` | Overall score, criteria breakdown, strengths, and improvement components. |
| `components/common/` | Reusable loading, error, empty-state, and accessible feedback primitives. |
| `hooks/` | Client hooks for session state, recording lifecycle, and submission state. |
| `lib/executiveMoments.js` | Canonical moment IDs, titles, descriptions, and evaluation criteria. |
| `lib/scoring.js` | Shared score ranges, labels, validation rules, and presentation helpers. |
| `lib/constants.js` | Stable application constants, limits, and default configuration values. |
| `services/whisper.js` | Server-side transcription adapter; it should not be called directly from browser components. |
| `services/openai.js` | Server-side AI client configuration and request boundary. |
| `services/analysis.js` | Builds the analysis request, invokes the model, validates the response, and returns the coaching contract. |
| `utils/` | Framework-independent formatting, duration, and transcript-cleanup utilities. |

## 7. Future API Integration Points

### Session creation

- **Endpoint:** `POST /api/sessions`
- **Input:** selected `momentId`.
- **Output:** `sessionId`, validated moment metadata, and client-safe recording constraints.

### Audio upload

- **Endpoint:** `POST /api/sessions/:sessionId/audio`
- **Input:** audio binary, MIME type, duration, and explicit recording consent.
- **Output:** upload status and an audio reference stored server-side.
- **Consideration:** use signed uploads or object storage for production-scale files rather than passing large recordings through the application server.

### Transcription

- **Endpoint:** `POST /api/sessions/:sessionId/transcription`
- **Input:** server-side audio reference.
- **Output:** transcript, language, duration, and confidence metadata.
- **Integration:** calls the adapter in `services/whisper.js`.

### Coaching analysis

- **Endpoint:** `POST /api/sessions/:sessionId/analysis`
- **Input:** session context and confirmed transcript; all server-side.
- **Output:** a schema-validated coaching result.
- **Integration:** calls `services/analysis.js`, which uses `services/openai.js`.

### Results retrieval

- **Endpoint:** `GET /api/sessions/:sessionId/results`
- **Output:** the latest validated coaching result or a clearly defined pending/error state.

### Feedback and deletion

- **Endpoints:** `POST /api/sessions/:sessionId/feedback` and `DELETE /api/sessions/:sessionId`
- **Purpose:** collect optional quality signals and honor user deletion requests.

## Implementation Guardrails

- Keep API keys and model instructions server-side only.
- Validate every external API response against a strict schema before persisting or rendering it.
- Use explicit loading, retry, and error states at upload, transcription, and analysis boundaries.
- Version both scoring rubrics and AI prompts so results can be traced and improved safely.
- Treat the AI response as untrusted data until validation succeeds.
