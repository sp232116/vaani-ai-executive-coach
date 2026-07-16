import Link from "next/link";

export default function RecordPage() {
  return (
    <main>
      <h1>Record your response</h1>
      <p>This step will capture your practice response for coaching.</p>
      <nav aria-label="Application flow">
        <Link className="btn btn-ghost" href="/moment">
          Back to moment
        </Link>
        <Link className="btn btn-primary" href="/analyzing">
          Continue to analysis
        </Link>
      </nav>
    </main>
  );
}
