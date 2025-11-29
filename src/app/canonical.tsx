/**
 * Canonical URL component to prevent duplicate content issues
 */

interface CanonicalProps {
  url: string;
}

export default function Canonical({ url }: CanonicalProps) {
  return (
    <link rel="canonical" href={url} />
  );
}
