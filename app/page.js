import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Vaani</h1>
      <p>Begin the executive coaching practice flow.</p>
      <nav aria-label="Application flow">
        <Link className="btn btn-primary" href="/moment">
          Choose a moment
        </Link>
      </nav>
    </main>
  );
}
