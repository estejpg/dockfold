import Link from 'next/link';
export default function NotFound() {
  return <main className="narrow-page builder-empty"><p>404</p><h1>This Dock isn’t here.</h1><p>The link may be incomplete, or its owner may have deleted the profile.</p><Link className="button button-dark" href="/">Back to DockFold</Link></main>;
}
