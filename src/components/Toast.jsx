import { useEffect } from 'react'
import styles from './Toast.module.scss'

const Toast = ({ message, onClose, duration = 2500 }) => {
  useEffect(() => {
    const timeoutId = window.setTimeout(onClose, duration)

    return () => window.clearTimeout(timeoutId)
  }, [duration, onClose])

  if (!message) return null

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      {message}
    </div>
  )
}

export default Toast
