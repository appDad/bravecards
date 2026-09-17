import { familyExists } from '../lib/store'
import CodePad from './CodePad'

export default function FamilyGate({ note, onEnter, onAdmin }) {
  const submit = async (code) => {
    try {
      if (!(await familyExists(code))) return "That code didn't work. Try again."
      onEnter(code)
      return true
    } catch (error) {
      console.error(error)
      return "Can't reach Brave Cards. Check the internet."
    }
  }

  return (
    <CodePad
      showLogo
      title="Family code"
      subtitle={note || 'Enter your family code to start.'}
      onSubmit={submit}
      footer={
        <button
          type="button"
          onClick={onAdmin}
          className="mt-4 min-h-11 rounded-full px-4 text-sm font-bold text-ink-soft underline-offset-4 hover:underline"
        >
          Admin sign in
        </button>
      }
    />
  )
}
