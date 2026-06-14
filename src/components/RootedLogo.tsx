export function RootedLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Dark green circle */}
      <circle cx="20" cy="20" r="20" fill="#006241" />
      {/* Stem */}
      <path d="M20 33 L20 21" stroke="#d4e9e2" strokeWidth="2.5" strokeLinecap="round" />
      {/* Left leaf */}
      <path d="M20 25 Q10 21 11 13 Q18 11 20 20Z" fill="#d4e9e2" />
      {/* Right leaf */}
      <path d="M20 21 Q30 17 29 9 Q22 7 20 16Z" fill="#d4e9e2" opacity="0.7" />
    </svg>
  );
}
