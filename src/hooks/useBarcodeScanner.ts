import { useEffect, useState, useCallback } from 'react'

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void
  enabled?: boolean
  scanDelay?: number // Minimum time between scans in ms
}

export function useBarcodeScanner({
  onScan,
  enabled = true,
  scanDelay = 100
}: UseBarcodeScannerOptions) {
  const [buffer, setBuffer] = useState('')
  const [lastScanTime, setLastScanTime] = useState(0)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    // Ignore if modifier keys are pressed (Ctrl, Alt, etc.)
    if (e.ctrlKey || e.altKey || e.metaKey) return

    // Enter key triggers the scan
    if (e.key === 'Enter') {
      if (buffer.length > 0) {
        const now = Date.now()
        if (now - lastScanTime >= scanDelay) {
          onScan(buffer)
          setLastScanTime(now)
        }
        setBuffer('')
        if (timeoutId) clearTimeout(timeoutId)
      }
      return
    }

    // Ignore non-printable keys
    if (e.key.length > 1) return

    // Add character to buffer
    setBuffer(prev => prev + e.key)

    // Clear buffer after timeout (in case it's not a scanner)
    if (timeoutId) clearTimeout(timeoutId)
    const newTimeoutId = setTimeout(() => {
      setBuffer('')
    }, 100) // 100ms timeout for manual typing
    setTimeoutId(newTimeoutId)
  }, [buffer, lastScanTime, timeoutId, onScan, enabled, scanDelay])

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [handleKeyDown, enabled, timeoutId])

  return {
    buffer,
    clearBuffer: () => setBuffer('')
  }
}
