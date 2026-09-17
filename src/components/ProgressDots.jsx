// One dot per card: filled for practiced, faded for skipped or buried, wide for the current card.
export default function ProgressDots({ count, index, results, color }) {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-label={`Card ${Math.min(index + 1, count)} of ${count}`}>
      {Array.from({ length: count }, (_, i) => {
        const result = results[i]
        const current = i === index
        return (
          <span
            key={i}
            className="h-2.5 rounded-full transition-all duration-300"
            style={{
              width: current ? 28 : 10,
              background: result === 'practiced' || current ? color : 'rgb(22 24 58 / 0.18)',
              opacity: result === 'skipped' || result === 'hidden' ? 0.45 : 1,
            }}
          />
        )
      })}
    </div>
  )
}
