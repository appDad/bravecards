export default function StreakFlame({ streak }) {
  const lit = streak > 0
  return (
    <span className="pill" aria-label={`${streak} day streak`}>
      <svg width="24" height="26" viewBox="0 0 24 26" aria-hidden="true" className="overflow-visible">
        <g className={lit ? 'flame-wobble' : ''}>
          <path
            d="M12 1.5c1.2 4 6.8 6.6 6.8 13a6.8 6.8 0 0 1-13.6 0c0-3.3 1.7-5.4 3.3-7 .2 2.2 1.1 3.5 2.4 4C10.4 8 10.4 4.6 12 1.5z"
            fill={lit ? '#ff7a1a' : '#b9c0d8'}
            stroke="#16183a"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M12 13c1 1.5 3.2 2.8 3.2 5.2a3.2 3.2 0 0 1-6.4 0c0-1.5.8-2.5 1.6-3.2.2 1 .7 1.6 1.3 1.8-.2-1.3.1-2.7.3-3.8z"
            fill={lit ? '#ffd23f' : '#e2e6f2'}
          />
        </g>
      </svg>
      <span className="tabular-nums">{streak}</span>
    </span>
  )
}
