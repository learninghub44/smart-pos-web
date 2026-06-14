'use client'

import { useRef, useEffect, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Printer, Printer as PrinterIcon, Wifi, Usb } from 'lucide-react'
import ThermalPrinter from '@/lib/thermalPrinter'

interface ReceiptProps {
  sale: any
  items: any[]
  shopName?: string
  shopAddress?: string
  shopPhone?: string
  shopEmail?: string
  cashierName?: string
  receiptFooter?: string
}

export default function Receipt({ 
  sale, 
  items, 
  shopName = 'SMART POS',
  shopAddress = '',
  shopPhone = '',
  shopEmail = '',
  cashierName = 'Cashier',
  receiptFooter = 'Thank you for your purchase!'
}: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [settings, setSettings] = useState<any>(null)
  const [thermalPrinter, setThermalPrinter] = useState<ThermalPrinter | null>(null)
  const [printerConnected, setPrinterConnected] = useState(false)
  const [showPrinterOptions, setShowPrinterOptions] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { getSettingByKey } = await import('@/lib/indexeddb')
      const businessSettings = await getSettingByKey('business')
      const receiptSettings = await getSettingByKey('receipt')
      
      if (businessSettings) {
        setSettings((prev: any) => ({ ...prev, business: businessSettings.value }))
      }
      if (receiptSettings) {
        setSettings((prev: any) => ({ ...prev, receipt: receiptSettings.value }))
      }
    } catch (error) {
      console.log('Error loading settings')
    }
  }

  const connectUSBPrinter = async () => {
    const printer = new ThermalPrinter()
    const connected = await printer.connectUSB()
    if (connected) {
      setThermalPrinter(printer)
      setPrinterConnected(true)
      setShowPrinterOptions(false)
    } else {
      alert('Failed to connect to USB printer')
    }
  }

  const connectBluetoothPrinter = async () => {
    const printer = new ThermalPrinter()
    const connected = await printer.connectBluetooth()
    if (connected) {
      setThermalPrinter(printer)
      setPrinterConnected(true)
      setShowPrinterOptions(false)
    } else {
      alert('Failed to connect to Bluetooth printer')
    }
  }

  const printWithThermalPrinter = async () => {
    if (!thermalPrinter || !printerConnected) {
      alert('No thermal printer connected')
      return
    }

    const receiptData = {
      shopName: businessName,
      shopAddress: businessAddress,
      shopPhone: businessPhone,
      receiptPin: sale.receipt_pin,
      receiptNumber: sale.receipt_number,
      created_at: sale.created_at,
      cashierName: cashierName,
      payment_method: sale.payment_method,
      total_amount: sale.total_amount,
      discount_amount: sale.discount_amount,
      cash_amount: sale.cash_amount,
      mpesa_amount: sale.mpesa_amount,
      card_amount: sale.card_amount,
      bank_amount: sale.bank_amount,
      notes: sale.notes,
      receiptFooter: footerText
    }

    const success = await thermalPrinter.printReceipt(receiptData, items)
    if (success) {
      alert('Receipt printed successfully')
    } else {
      alert('Failed to print receipt')
    }
  }

  const disconnectPrinter = async () => {
    if (thermalPrinter) {
      await thermalPrinter.disconnect()
      setThermalPrinter(null)
      setPrinterConnected(false)
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    pageStyle: `
      @media print {
        @page {
          size: 80mm auto;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
        }
        .receipt-container {
          width: 80mm;
          padding: 5mm;
          font-family: monospace;
          font-size: 12px;
        }
      }
    `
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const businessName = settings?.business?.name || shopName
  const businessAddress = settings?.business?.address || shopAddress
  const businessPhone = settings?.business?.phone || shopPhone
  const businessEmail = settings?.business?.email || shopEmail
  const footerText = settings?.receipt?.footer || receiptFooter

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {printerConnected ? (
          <>
            <button
              onClick={printWithThermalPrinter}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Printer className="h-4 w-4" />
              <span>Print Thermal</span>
            </button>
            <button
              onClick={disconnectPrinter}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              <PrinterIcon className="h-4 w-4" />
              <span>Disconnect</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              <span>Print (Browser)</span>
            </button>
            <button
              onClick={() => setShowPrinterOptions(!showPrinterOptions)}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              <PrinterIcon className="h-4 w-4" />
              <span>Connect Thermal</span>
            </button>
          </>
        )}
      </div>

      {showPrinterOptions && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <p className="font-medium">Connect Thermal Printer:</p>
          <div className="flex gap-2">
            <button
              onClick={connectUSBPrinter}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Usb className="h-4 w-4" />
              <span>USB Printer</span>
            </button>
            <button
              onClick={connectBluetoothPrinter}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Wifi className="h-4 w-4" />
              <span>Bluetooth Printer</span>
            </button>
          </div>
          <p className="text-xs text-gray-600">
            Note: WebUSB and WebBluetooth require HTTPS and browser support
          </p>
        </div>
      )}

      <div
        ref={receiptRef}
        className="receipt-container bg-white border-2 border-dashed border-gray-300 p-6 max-w-xs mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-4 border-b pb-4">
          <h1 className="text-xl font-bold">{businessName}</h1>
          {businessAddress && <p className="text-xs text-gray-600">{businessAddress}</p>}
          {businessPhone && <p className="text-xs text-gray-600">Tel: {businessPhone}</p>}
          {businessEmail && <p className="text-xs text-gray-600">{businessEmail}</p>}
        </div>

        {/* Receipt Info */}
        <div className="mb-4 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Receipt No:</span>
            <span className="font-semibold">{sale.receipt_number || sale.receipt_pin}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Receipt PIN:</span>
            <span className="font-bold text-lg">{sale.receipt_pin}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span>{formatDate(sale.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cashier:</span>
            <span>{cashierName}</span>
          </div>
        </div>

        {/* Items */}
        <div className="mb-4 border-t border-b py-2">
          <div className="font-bold mb-2">Items</div>
          {items.map((item, index) => (
            <div key={index} className="flex justify-between mb-1">
              <div className="flex-1">
                <div>{item.name || item.products?.name || 'Product'}</div>
                <div className="text-xs text-gray-600">
                  {item.quantity} x KES {item.price.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div>KES {(item.price * item.quantity).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1">
          {sale.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount:</span>
              <span>-KES {sale.discount_amount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>TOTAL</span>
            <span>KES {sale.total_amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Method:</span>
            <span className="capitalize">{sale.payment_method.replace('_', ' ')}</span>
          </div>
          
          {/* Payment breakdown for mixed payments */}
          {sale.payment_method === 'mixed' && (
            <div className="text-xs text-gray-600 space-y-1 mt-1">
              {sale.cash_amount > 0 && (
                <div className="flex justify-between">
                  <span>Cash:</span>
                  <span>KES {sale.cash_amount.toLocaleString()}</span>
                </div>
              )}
              {sale.mpesa_amount > 0 && (
                <div className="flex justify-between">
                  <span>M-Pesa:</span>
                  <span>KES {sale.mpesa_amount.toLocaleString()}</span>
                </div>
              )}
              {sale.card_amount > 0 && (
                <div className="flex justify-between">
                  <span>Card:</span>
                  <span>KES {sale.card_amount.toLocaleString()}</span>
                </div>
              )}
              {sale.bank_amount > 0 && (
                <div className="flex justify-between">
                  <span>Bank:</span>
                  <span>KES {sale.bank_amount.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="mt-3 pt-2 border-t">
            <p className="text-xs text-gray-600"><strong>Notes:</strong> {sale.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-4 pt-2 border-t text-xs text-gray-600">
          <p>{footerText}</p>
          <p>Keep this receipt for returns</p>
          <p className="mt-2">Receipt PIN: {sale.receipt_pin}</p>
        </div>
      </div>
    </div>
  )
}
