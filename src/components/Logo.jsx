export default function Logo({ size = 'lg' }) {
  const big = size === 'lg'
  return (
    <div className="flex items-center justify-center gap-3">
      <svg width={big ? 52 : 40} height={big ? 52 : 40} viewBox="0 0 64 64" aria-hidden="true">
        <rect x="8" y="12" width="32" height="44" rx="7" fill="#2f6bff" transform="rotate(-12 24 34)" />
        <rect
          x="22"
          y="8"
          width="32"
          height="44"
          rx="7"
          fill="#ffc833"
          stroke="#16183a"
          strokeWidth="3"
          transform="rotate(8 38 30)"
        />
        <path
          d="M38 19l3.2 6.6 7.2 1-5.2 5 1.3 7.2-6.5-3.4-6.5 3.4 1.3-7.2-5.2-5 7.2-1z"
          fill="#16183a"
          transform="rotate(8 38 30)"
        />
      </svg>
      <span
        className={`font-display leading-none text-ink ${big ? 'text-[44px]' : 'text-3xl'}`}
        style={{ textShadow: '0 3px 0 rgb(22 24 58 / 0.12)' }}
      >
        Brave Cards
      </span>
    </div>
  )
}
