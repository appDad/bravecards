export default function DeckDone({ summary, onAgain, onRetrySkipped, onHome }) {
  const { practiced, skipped, hidden, earned } = summary
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <span className="pop-in text-[88px] leading-none" aria-hidden="true">
        🏅
      </span>
      <h1 className="mt-4 font-display text-[44px] leading-none">Deck done!</h1>
      <p className="mt-3 text-lg text-ink-soft">
        {practiced} practiced · {skipped.length} skipped{hidden > 0 && ` · ${hidden} hidden`}
      </p>
      {earned > 0 && <p className="pop-in mt-4 rounded-full bg-white px-5 py-2 font-display text-3xl">+{earned} ⭐</p>}

      <div className="mt-10 flex w-full flex-col gap-4">
        {skipped.length > 0 && (
          <button type="button" className="btn3d w-full" style={{ '--c': '#ffc833' }} onClick={onRetrySkipped}>
            Try the {skipped.length} you skipped
          </button>
        )}
        <button type="button" className="btn3d w-full" onClick={onAgain}>
          Go again
        </button>
        <button type="button" className="btn3d w-full" onClick={onHome}>
          Back home
        </button>
      </div>
    </div>
  )
}
