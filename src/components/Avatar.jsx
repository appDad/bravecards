export default function Avatar({ kid, size = 96 }) {
  return (
    <span
      className="avatar"
      style={{ '--c': kid.color, width: size, height: size, fontSize: Math.round(size * 0.52) }}
      aria-hidden="true"
    >
      {kid.avatar}
    </span>
  )
}
