import { useEffect, useState } from 'react'
import { expectedDigits, loadProblem, lockoutSeconds, nextProblem, recordMiss, recordSolved } from '../lib/mathGate'
import CodePad from './CodePad'

const LOCKED_MESSAGE = 'Too many tries. Wait a minute.'

// Settings lock: math built on the family code, answered with its last two digits.
export default function MathGate({ familyCode, onUnlock, onCancel }) {
  const [problem, setProblem] = useState(loadProblem)
  const [lockLeft, setLockLeft] = useState(lockoutSeconds)

  // Count down once a second while locked.
  useEffect(() => {
    if (lockLeft <= 0) return
    const timer = setTimeout(() => setLockLeft(lockoutSeconds()), 1000)
    return () => clearTimeout(timer)
  }, [lockLeft])

  const submit = (digits) => {
    // Another tab may have started a lockout since this pad was last checked.
    const running = lockoutSeconds()
    if (running) {
      setLockLeft(running)
      return LOCKED_MESSAGE
    }
    if (digits === expectedDigits(familyCode, problem)) {
      recordSolved()
      onUnlock()
      return true
    }
    const locked = recordMiss()
    setProblem(nextProblem())
    if (locked) {
      setLockLeft(locked)
      return LOCKED_MESSAGE
    }
    return "Not quite. Here's a new one."
  }

  return (
    <CodePad
      title="Grown-ups only"
      subtitle="Grab a calculator."
      length={2}
      disabled={lockLeft > 0}
      onSubmit={submit}
      onCancel={onCancel}
    >
      <div className="w-full rounded-[28px] bg-white px-5 py-4 text-center shadow-[0_6px_0_rgb(22_24_58/0.1)]">
        {lockLeft > 0 ? (
          // role="timer" is silent to screen readers; the lock was already announced once.
          <p className="py-3 font-display text-2xl" role="timer">
            Try again in {lockLeft}s
          </p>
        ) : (
          <>
            <p className="font-display text-[32px] leading-tight">
              {/* Non-breaking spaces keep "× 37)" and "+ 58" together when the line wraps. */}
              (<span className="rounded-xl bg-gold px-2">family code</span> ×{' '}
              {problem.times}) +{' '}
              {problem.plus}
            </p>
            <p className="mt-2 font-bold">
              Tap the last 2 digits of the answer
              <span className="block text-sm font-normal text-ink-soft">(123,456 → 56)</span>
            </p>
          </>
        )}
      </div>
    </CodePad>
  )
}
