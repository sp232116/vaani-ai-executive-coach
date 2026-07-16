import Link from "next/link";

export default function ResultsPage() {
  return (
    <main>
      <h1>Coaching results</h1>
      <p>Your future coaching feedback will be presented at this step.</p>
      <nav aria-label="Application flow">
        <Link className="btn btn-ghost" href="/record">
          Back to recording
        </Link>
        <Link className="btn btn-primary" href="/">
          Start again
        </Link>
      </nav>
    </main>
  );
}
