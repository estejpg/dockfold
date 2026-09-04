'use client';
import Link from 'next/link';
export default function ProfileError({ reset }: { reset: () => void }) {
  return <main className="narrow-page"><h1>We couldn’t load this Dock.</h1><p>Sharing may be temporarily unavailable. Please try again in a moment.</p><div className="share-actions"><button className="button button-dark" onClick={reset}>Try again</button><Link className="button button-line" href="/">Back to DockFold</Link></div></main>;
}
