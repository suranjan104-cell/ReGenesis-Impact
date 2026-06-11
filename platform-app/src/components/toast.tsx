import { useState } from 'react'
import type { ReactNode } from 'react'

let toastTimer: ReturnType<typeof setTimeout> | null = null

/** Tiny toast: returns the node to render and a show(msg) trigger. */
export function useToast(): [ReactNode, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null)
  const show = (m: string) => {
    setMsg(m)
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => setMsg(null), 2600)
  }
  const node = msg ? <div className="toast" role="status">{msg}</div> : null
  return [node, show]
}
