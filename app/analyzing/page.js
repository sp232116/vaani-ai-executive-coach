import Link from "next/link";

export default function AnalyzingPage() {
  return (
    <main>
      <h1>Analyzing your response</h1>
      <p>This step will prepare coaching feedback for your practice response.</p>
      <nav aria-label="Application flow">
        <Link className="btn btn-ghost" href="/record">
          Back to recording
        </Link>
        <Link className="btn btn-primary" href="/results">
          View results
        </Link>
      </nav>
    </main>
  );
}
