import Link from "next/link";

export default function NotFound() {
  return <main className="builder-empty"><p>404</p><h1>That Dock can’t be unfolded.</h1><p>The link may be incomplete or from a newer manifest version.</p><Link className="button button-dark" href="/">Back to Discover</Link></main>;
}
