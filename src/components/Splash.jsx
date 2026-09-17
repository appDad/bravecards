import Logo from './Logo'

export default function Splash() {
  return (
    <div className="flex flex-1 items-center justify-center" role="status" aria-label="Loading">
      <div className="pop-in">
        <Logo />
      </div>
    </div>
  )
}
