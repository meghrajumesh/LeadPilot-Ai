"use client";

const BAR_COUNT = 36;

export function VoiceVisualizer() {
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const angle = (i / BAR_COUNT) * 360;
    const rad = (angle * Math.PI) / 180;
    const radius = 70;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;
    const delay = (i / BAR_COUNT) * 1.2;
    return { x, y, angle, delay };
  });

  return (
    <svg className="h-48 w-48" viewBox="-96 -96 192 192">
      <defs>
        <linearGradient id="vizGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      {bars.map((bar) => (
        <rect
          key={bar.angle}
          className="origin-center"
          fill="url(#vizGrad)"
          height="6"
          rx="3"
          style={{
            animation: `voice-pulse 1.2s ease-in-out ${bar.delay}s infinite`,
            transform: `translate(${bar.x}px, ${bar.y}px) rotate(${bar.angle}deg)`,
            transformOrigin: "0 0",
          }}
          width="3"
          x="0"
          y="-4"
        />
      ))}
    </svg>
  );
}
