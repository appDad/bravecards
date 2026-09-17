// total and practicedCount leave out cards this kid hid.
export default function CategoryTile({ category, practicedCount, total, index, stagger, wide = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tile flex min-h-[132px] flex-col items-start p-4 text-left ${wide ? 'col-span-2' : ''} ${stagger ? 'tile-stagger' : ''}`}
      style={{ '--c': category.color, '--i': index, color: category.text }}
    >
      <span className="text-[36px] leading-none" aria-hidden="true">
        {category.emoji}
      </span>
      <span className="mt-auto pt-3 font-display text-[22px] leading-[1.1]">{category.name}</span>
      <span className="mt-2 flex w-full items-center gap-2 text-sm font-bold">
        <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-current/20">
          <span
            className="block h-full rounded-full bg-current opacity-80"
            style={{ width: `${total ? (practicedCount / total) * 100 : 0}%` }}
          />
        </span>
        {practicedCount}/{total}
      </span>
    </button>
  )
}
