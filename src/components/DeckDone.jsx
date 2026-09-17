export default function DeckDone({ summary, onAgain, onRetryLeft, onHome }) {
  const { practiced, left, buried, earned } = summary
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <span className="pop-in text-[88px] leading-none" aria-hidden="true">
        🏅
      </span>
      <h1 className="mt-4 font-display text-[44px] leading-none">Deck done!</h1>
      <p className="mt-3 text-lg text-ink-soft">
        {practiced} practiced{left.length > 0 && ` · ${left.length} left`}
        {buried > 0 && ` · ${buried} buried`}
      </p>
      {earned > 0 && <p className="pop-in mt-4 rounded-full bg-white px-5 py-2 font-display text-3xl">+{earned} ⭐</p>}

      <div className="mt-10 flex w-full flex-col gap-4">
        {left.length > 0 && (
          <button type="button" className="btn3d w-full" style={{ '--c': '#ffc833' }} onClick={onRetryLeft}>
            Practice the {left.length} you left
          </button>
        )}
        <button type="button" className="btn3d w-full" onClick={onAgain}>
          New cards
        </button>
        <button type="button" className="btn3d w-full" onClick={onHome}>
          Back home
        </button>
      </div>
    </div>
  )
}
