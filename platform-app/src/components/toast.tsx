import { useRef, useState } from 'react'
import type { ReactNode } from 'react'

/** Tiny toast: returns the node to render and a show(msg) trigger. */
export function useToast(): [ReactNode, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const show = (m: string) => {
    setMsg(m)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(null), 2600)
  }
  const node = msg ? <div className="toast" role="status">{msg}</div> : null
  return [node, show]
}
