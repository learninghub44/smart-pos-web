'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { X, Camera, Flashlight, FlashlightOff, RefreshCw, Loader2, AlertCircle } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  continuous?: boolean
  showFlashlight?: boolean
}

export default function BarcodeScanner({
  onScan, onClose, continuous = true, showFlashlight = true
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const mountedRef = useRef(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [flashlightOn, setFlashlightOn] = useState(false)
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [scanned, setScanned] = useState(false)
  const [lastCode, setLastCode] = useState('')

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState()
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await scannerRef.current.stop()
        }
        await scannerRef.current.clear()
      } catch (_) {}
      scannerRef.current = null
    }
  }, [])

  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = 1200; osc.type = 'sine'
      gain.gain.value = 0.15
      osc.start(); osc.stop(ctx.currentTime + 0.08)
    } catch (_) {}
  }, [])

  const startScanner = useCallback(async () => {
    setLoading(true)
    setError('')
    await stopScanner()

    // Small delay to let DOM settle
    await new Promise(r => setTimeout(r, 200))
    if (!mountedRef.current) return

    const el = document.getElementById('qr-reader-box')
    if (!el) { setError('Scanner element not found'); setLoading(false); return }

    try {
      // Request camera permission explicitly first
      await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } })
    } catch (err: any) {
      setError('Camera permission denied. Please allow camera access and try again.')
      setLoading(false)
      return
    }

    try {
      const scanner = new Html5Qrcode('qr-reader-box', { verbose: false })
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: facing },
        { fps: 15, qrbox: { width: 240, height: 140 }, aspectRatio: 1.5 },
        (code) => {
          if (!mountedRef.current) return
          if (code === lastCode) return // debounce same code
          setLastCode(code)
          setTimeout(() => setLastCode(''), 2000)
          playBeep()
          if (navigator.vibrate) navigator.vibrate(80)
          setScanned(true)
          setTimeout(() => setScanned(false), 400)
          onScan(code)
          if (!continuous) { stopScanner(); onClose() }
        },
        () => {} // frame error — ignore
      )
      if (mountedRef.current) setLoading(false)
    } catch (err: any) {
      if (mountedRef.current) {
        setError('Could not start camera. Try switching camera or check browser permissions.')
        setLoading(false)
      }
    }
  }, [facing, continuous, onScan, onClose, stopScanner, playBeep, lastCode])

  useEffect(() => {
    mountedRef.current = true
    startScanner()
    return () => {
      mountedRef.current = false
      stopScanner()
    }
  }, [facing]) // eslint-disable-line

  const toggleFlash = async () => {
    if (!scannerRef.current) return
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !flashlightOn } as MediaTrackConstraintSet]
      })
      setFlashlightOn(v => !v)
    } catch (_) {}
  }

  const switchCamera = async () => {
    await stopScanner()
    setFacing(f => f === 'environment' ? 'user' : 'environment')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Scan Barcode</span>
            {continuous && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Live</span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Camera view */}
        <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
              <span className="text-white text-sm">Starting camera...</span>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 z-10">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-white text-sm text-center">{error}</p>
              <button onClick={startScanner}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          )}

          {/* Scanner element — always rendered */}
          <div id="qr-reader-box" className="w-full h-full" />

          {/* Scan overlay */}
          {!loading && !error && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner brackets */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-32 transition-all duration-200 ${scanned ? 'opacity-100' : 'opacity-80'}`}>
                <div className={`absolute inset-0 rounded-lg border-2 ${scanned ? 'border-green-400 bg-green-400/20' : 'border-transparent'} transition-all`} />
                {/* Animated scan line */}
                {!scanned && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" style={{ animation: 'scanLine 2s ease-in-out infinite' }} />
                )}
                {/* Corners */}
                {[['top-0 left-0', 'border-t-2 border-l-2'], ['top-0 right-0', 'border-t-2 border-r-2'], ['bottom-0 left-0', 'border-b-2 border-l-2'], ['bottom-0 right-0', 'border-b-2 border-r-2']].map(([pos, border], i) => (
                  <div key={i} className={`absolute ${pos} w-5 h-5 ${border} ${scanned ? 'border-green-400' : 'border-blue-400'} rounded-sm transition-colors`} />
                ))}
              </div>
            </div>
          )}

          {/* Controls overlay */}
          {!loading && !error && (
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3 pointer-events-auto">
              {showFlashlight && (
                <button onClick={toggleFlash}
                  className="p-2.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors">
                  {flashlightOn
                    ? <FlashlightOff className="w-5 h-5 text-yellow-300" />
                    : <Flashlight className="w-5 h-5" />}
                </button>
              )}
              <button onClick={switchCamera}
                className="p-2.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-gray-50 text-center text-xs text-gray-500">
          Point camera at barcode • Supports EAN, UPC, QR, Code128
        </div>
      </div>

      <style>{`
        #qr-reader-box video { width: 100% !important; height: 100% !important; object-fit: cover !important; }
        #qr-reader-box canvas { display: none !important; }
        #qr-reader-box > div { border: none !important; padding: 0 !important; }
        @keyframes scanLine { 0%,100% { top: 10%; } 50% { top: 85%; } }
      `}</style>
    </div>
  )
}
