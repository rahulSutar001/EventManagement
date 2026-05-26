export function downloadCertificate(o: { name: string; event: string; role: string; date: string; uid: string; score?: number | null }) {
  const isVolunteer = o.role.toLowerCase() === "volunteer";
  const title = isVolunteer ? "CERTIFICATE OF VOLUNTEERING" : "CERTIFICATE OF PARTICIPATION";
  
  const bodyText = isVolunteer
    ? `in recognition of their outstanding service, dedication, and invaluable contribution as a Volunteer in`
    : `in recognition of their active participation and engagement in`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 850" width="1200" height="850">
  <defs>
    <!-- Background cream gradient -->
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FCFAF2"/>
      <stop offset="1" stop-color="#F5F2E5"/>
    </linearGradient>
    
    <!-- Gold text gradient -->
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#C5A059"/>
      <stop offset="0.5" stop-color="#E5C180"/>
      <stop offset="1" stop-color="#B28C47"/>
    </linearGradient>
  </defs>

  <!-- 1. Background Cream Canvas -->
  <rect width="1200" height="850" fill="url(#bg)"/>

  <!-- 2. Geometric Borders & Corner Flags (Navy/Gold style) -->
  <!-- Top gold banner corner -->
  <polygon points="0,0 200,0 0,60" fill="#E5C180"/>
  <!-- Left navy vertical stripe -->
  <rect x="0" y="60" width="30" height="730" fill="#1E293B"/>
  <polygon points="0,790 30,790 0,850" fill="#1E293B"/>
  
  <!-- Right navy vertical stripe -->
  <rect x="1170" y="60" width="30" height="730" fill="#1E293B"/>
  <polygon points="1200,790 1170,790 1200,850" fill="#1E293B"/>

  <!-- Top-left navy edge banner -->
  <polygon points="30,0 120,0 30,90" fill="#0F172A"/>

  <!-- Bottom-left gold edge banner -->
  <polygon points="0,850 180,850 0,770" fill="#E5C180"/>
  <polygon points="30,850 120,850 30,760" fill="#0F172A"/>

  <!-- Bottom-right gold edge banner -->
  <polygon points="1200,850 1020,850 1200,770" fill="#E5C180"/>
  <polygon points="1170,850 1080,850 1170,760" fill="#0F172A"/>

  <!-- Top-right gold banner corner -->
  <polygon points="1200,0 1000,0 1200,60" fill="#E5C180"/>
  <polygon points="1170,0 1080,0 1170,90" fill="#0F172A"/>

  <!-- Inner Double thin border lines -->
  <rect x="50" y="40" width="1100" height="770" fill="none" stroke="#E5C180" stroke-width="2"/>
  <rect x="58" y="48" width="1084" height="754" fill="none" stroke="#0F172A" stroke-width="1" stroke-dasharray="8,4"/>

  <!-- 3. Mock Verification QR Code (Top Right) -->
  <g transform="translate(1040, 70)">
    <rect width="80" height="80" fill="white" stroke="#E5C180" stroke-width="2" rx="4"/>
    <!-- Finder Patterns -->
    <rect x="8" y="8" width="20" height="20" fill="#0F172A"/>
    <rect x="12" y="12" width="12" height="12" fill="white"/>
    <rect x="15" y="15" width="6" height="6" fill="#0F172A"/>

    <rect x="52" y="8" width="20" height="20" fill="#0F172A"/>
    <rect x="56" y="12" width="12" height="12" fill="white"/>
    <rect x="59" y="15" width="6" height="6" fill="#0F172A"/>

    <rect x="8" y="52" width="20" height="20" fill="#0F172A"/>
    <rect x="12" y="56" width="12" height="12" fill="white"/>
    <rect x="15" y="59" width="6" height="6" fill="#0F172A"/>

    <!-- Mini random noise blocks for realistic QR look -->
    <rect x="36" y="12" width="6" height="6" fill="#0F172A"/>
    <rect x="44" y="20" width="6" height="10" fill="#0F172A"/>
    <rect x="36" y="32" width="12" height="6" fill="#0F172A"/>
    <rect x="12" y="36" width="6" height="8" fill="#0F172A"/>
    <rect x="24" y="44" width="8" height="6" fill="#0F172A"/>
    <rect x="52" y="36" width="16" height="6" fill="#0F172A"/>
    <rect x="36" y="52" width="10" height="10" fill="#0F172A"/>
    <rect x="56" y="52" width="12" height="6" fill="#0F172A"/>
    <rect x="62" y="62" width="6" height="6" fill="#0F172A"/>
    <text x="40" y="75" font-family="monospace" font-size="6" text-anchor="middle" fill="#64748B">VERIFIED</text>
  </g>

  <!-- 4. Certificate Header/Title -->
  <text x="600" y="130" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="bold" fill="#B28C47" letter-spacing="4">E V E N T T E C H  P L A T F O R M</text>
  
  <text x="600" y="210" text-anchor="middle" font-family="'Times New Roman', Times, Georgia, serif" font-size="44" font-weight="bold" fill="#0F172A" letter-spacing="1">${title}</text>
  
  <text x="600" y="280" text-anchor="middle" font-family="Georgia, serif" font-size="18" font-style="italic" fill="#64748B">THIS CERTIFICATE IS PROUDLY PRESENTED TO</text>

  <!-- 5. Recipient Name -->
  <text x="600" y="380" text-anchor="middle" font-family="'Brush Script MT', cursive, Georgia, serif" font-size="65" fill="url(#goldGrad)" font-weight="bold" font-style="italic">${escapeXml(o.name)}</text>
  <line x1="400" y1="405" x2="800" y2="405" stroke="#E5C180" stroke-width="1.5"/>

  <!-- 6. Achievement Details -->
  <text x="600" y="460" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#475569" max-width="800">
    ${bodyText}
  </text>
  
  <!-- Event Name -->
  <text x="600" y="515" text-anchor="middle" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="#0F172A">${escapeXml(o.event)}</text>
  
  <!-- Event Date -->
  <text x="600" y="565" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="16" font-style="italic" fill="#64748B">Conducted on ${escapeXml(o.date)}</text>

  <!-- Optional score indicator (e.g. for volunteers) -->
  ${o.score ? `
  <g transform="translate(600, 615)">
    <rect x="-100" y="-18" width="200" height="30" fill="#FCFAF2" stroke="#E5C180" stroke-width="1" rx="6"/>
    <text text-anchor="middle" y="3" font-family="Helvetica" font-size="13" font-weight="bold" fill="#B28C47">Performance Rating: ${o.score} / 10</text>
  </g>
  ` : ""}

  <!-- 7. Signatures -->
  <!-- Left Signature -->
  <g transform="translate(250, 710)">
    <!-- Elegant mock signature lines -->
    <path d="M-60,-20 Q-40,-50 -20,-20 T20,-30 T60,-15" fill="none" stroke="#2563EB" stroke-width="1.5" opacity="0.8"/>
    <line x1="-80" y1="0" x2="80" y2="0" stroke="#94A3B8" stroke-width="1"/>
    <text text-anchor="middle" y="20" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="bold" fill="#0F172A">DR. ARWIND AGARWAL</text>
    <text text-anchor="middle" y="35" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#64748B">President</text>
  </g>

  <!-- Laurel Wreath Badge (Center Bottom) -->
  <g transform="translate(600, 700)" stroke="#B28C47" fill="none" stroke-width="1.5">
    <path d="M-25,-15 C-40,-5 -40,15 -10,25 C-5,22 -5,12 -15,10" />
    <path d="M25,-15 C40,-5 40,15 10,25 C5,22 C5,12 15,10" />
    <circle cx="0" cy="5" r="10" stroke="#E5C180" stroke-width="2"/>
    <polygon points="0,-1 -3,4 3,4" fill="#E5C180" stroke="none"/>
  </g>

  <!-- Right Signature -->
  <g transform="translate(950, 710)">
    <!-- Elegant mock signature lines -->
    <path d="M-50,-15 Q-20,-45 0,-15 T40,-25 T70,-10" fill="none" stroke="#2563EB" stroke-width="1.5" opacity="0.8"/>
    <line x1="-80" y1="0" x2="80" y2="0" stroke="#94A3B8" stroke-width="1"/>
    <text text-anchor="middle" y="20" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="bold" fill="#0F172A">DR. PUJA AGARWAL</text>
    <text text-anchor="middle" y="35" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#64748B">Vice President</text>
  </g>

  <!-- 8. Verification Footer Metadata -->
  <text x="600" y="795" text-anchor="middle" font-family="monospace" font-size="11" fill="#94A3B8">Certificate UID: ${escapeXml(o.uid)}</text>
  <text x="600" y="812" text-anchor="middle" font-family="Helvetica" font-size="9" fill="#94A3B8">Generated dynamically by EventFlow Connect on ${new Date().toLocaleDateString()}</text>
</svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `EventTech-${o.role}-Certificate-${o.uid}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, c => ({ "<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;","\"":"&quot;" }[c]!));
}
