export function downloadCertificate(o: { name: string; event: string; role: string; date: string; uid: string; score?: number | null }) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 850" width="1200" height="850">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#A855F7"/><stop offset="1" stop-color="#EC4899"/>
    </linearGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F0FDF4"/><stop offset="1" stop-color="#FFFFFF"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="850" fill="url(#bg)"/>
  <rect x="40" y="40" width="1120" height="770" fill="none" stroke="url(#g)" stroke-width="6" rx="20"/>
  <rect x="60" y="60" width="1080" height="730" fill="none" stroke="#E2E8F0" stroke-width="2" rx="14"/>
  <text x="600" y="160" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="#A855F7">EventTech</text>
  <text x="600" y="240" text-anchor="middle" font-family="Georgia, serif" font-size="64" font-weight="bold" fill="#0f172a">Certificate of ${o.role}</text>
  <text x="600" y="320" text-anchor="middle" font-family="Helvetica, sans-serif" font-size="22" fill="#475569">This is to certify that</text>
  <text x="600" y="400" text-anchor="middle" font-family="Georgia, serif" font-size="56" fill="url(#g)" font-weight="bold">${escapeXml(o.name)}</text>
  <text x="600" y="470" text-anchor="middle" font-family="Helvetica" font-size="22" fill="#475569">has successfully participated as ${escapeXml(o.role)} in</text>
  <text x="600" y="530" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="#0f172a">${escapeXml(o.event)}</text>
  <text x="600" y="580" text-anchor="middle" font-family="Helvetica" font-size="18" fill="#64748B">held on ${escapeXml(o.date)}</text>
  ${o.score ? `<text x="600" y="630" text-anchor="middle" font-family="Helvetica" font-size="20" fill="#EC4899">Performance Score: ${o.score} / 10</text>`:""}
  <text x="600" y="740" text-anchor="middle" font-family="monospace" font-size="14" fill="#64748B">Certificate ID: ${escapeXml(o.uid)}</text>
  <text x="600" y="770" text-anchor="middle" font-family="Helvetica" font-size="12" fill="#94A3B8">Verified by EventTech • ${new Date().toLocaleDateString()}</text>
</svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `EventTech-Certificate-${o.uid}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, c => ({ "<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;","\"":"&quot;" }[c]!));
}
