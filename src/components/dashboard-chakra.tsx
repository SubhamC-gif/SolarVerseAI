const SPOKES = Array.from({ length: 24 }, (_, i) => i * 15);

export function ChakraBackdrop() {
  return (
    <div
      aria-hidden
      className="live-bg pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
    >
      <svg
        viewBox="-100 -100 200 200"
        className="h-[140%] w-auto max-w-none opacity-30"
        style={{ animation: "chakra-spin 60s linear infinite" }}
      >
        <defs>
          <linearGradient id="chakra-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFE58A" />
            <stop offset="0.5" stopColor="#FFC93C" />
            <stop offset="1" stopColor="#B8860B" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#chakra-gold)">
          <circle r="94" strokeWidth="3" />
          <circle r="82" strokeWidth="1.5" />
          <circle r="24" strokeWidth="3" />
          {SPOKES.map((deg) => (
            <line
              key={deg}
              x1="0"
              y1="-24"
              x2="0"
              y2="-94"
              strokeWidth="2.5"
              transform={`rotate(${deg})`}
            />
          ))}
        </g>
        <circle r="10" fill="url(#chakra-gold)" />
      </svg>
    </div>
  );
}
