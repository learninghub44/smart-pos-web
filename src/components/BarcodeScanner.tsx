'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, Camera, Flashlight, Camera as CameraIcon, Zap, Loader2 } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  continuous?: boolean
  showFlashlight?: boolean
}

export default function BarcodeScanner({ onScan, onClose, continuous = true, showFlashlight = true }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [flashlightOn, setFlashlightOn] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment')
  const [scanned, setScanned] = useState(false)

  useEffect(() => {
    let mounted = true

    async function startScanner() {
      try {
        const scanner = new Html5Qrcode('barcode-scanner-reader')
        scannerRef.current = scanner

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0
        }

        await scanner.start(
          { facingMode: cameraFacing },
          config,
          (decodedText) => {
            if (!mounted) return

            // Vibrate on success
            if (navigator.vibrate) {
              navigator.vibrate(100)
            }

            // Play beep sound
            playBeep()

            onScan(decodedText)

            if (!continuous) {
              stopScanner()
              onClose()
            } else {
              // Visual feedback
              setScanned(true)
              setTimeout(() => setScanned(false), 300)
            }
          },
          (errorMessage) => {
            // Ignore frame processing errors
          }
        )

        setLoading(false)
        setError('')
      } catch (err) {
        if (mounted) {
          setError('Camera access denied or not available')
          setLoading(false)
        }
      }
    }

    startScanner()

    return () => {
      mounted = false
      stopScanner()
    }
  }, [cameraFacing, continuous, onScan, onClose])

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop()
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
  }

  const toggleFlashlight = async () => {
    if (!scannerRef.current) return

    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !flashlightOn } as MediaTrackConstraintSet]
      })
      setFlashlightOn(!flashlightOn)
    } catch (err) {
      console.error('Error toggling flashlight:', err)
    }
  }

  const switchCamera = async () => {
    await stopScanner()
    setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')
  }

  const playBeep = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 1000
    oscillator.type = 'sine'
    gainNode.gain.value = 0.1

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.1)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Camera className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Scan Barcode</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="relative aspect-video bg-gray-900">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-12 w-12 text-white animate-spin" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <Camera className="h-12 w-12 mx-auto mb-2" />
                <p className="text-lg">{error}</p>
              </div>
            </div>
          )}

          <div id="barcode-scanner-reader" className="w-full h-full" />

          {!loading && !error && (
            <>
              <div className="absolute inset-0 pointer-events-none">
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-32 border-4 ${scanned ? 'border-green-400 bg-green-400 bg-opacity-20' : 'border-green-500'} rounded-lg transition-all duration-200`}>
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500 -mt-2 -ml-2" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500 -mt-2 -mr-2" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500 -mb-2 -ml-2" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500 -mb-2 -mr-2" />
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-green-500 opacity-50" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-green-500 opacity-50" />
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                {showFlashlight && (
                  <button
                    onClick={toggleFlashlight}
                    className="p-3 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-opacity-100 transition-opacity"
                  >
                    <Flashlight className={`h-6 w-6 ${flashlightOn ? 'text-yellow-500' : 'text-gray-600'}`} />
                  </button>
                )}

                <button
                  onClick={switchCamera}
                  className="p-3 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-opacity-100 transition-opacity"
                >
                  <CameraIcon className="h-6 w-6 text-gray-600" />
                </button>

                {continuous && (
                  <div className="flex items-center space-x-2 px-3 py-2 bg-white bg-opacity-90 rounded-full shadow-lg">
                    <Zap className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Continuous</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="p-4 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Position the barcode within the frame to scan
          </p>
        </div>
      </div>
    </div>
  )
}
