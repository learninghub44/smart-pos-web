'use client'

import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, Usb, Bluetooth, X, CheckCircle2 } from 'lucide-react'
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

function ReceiptContent({
  sale, items, businessName, businessAddress, businessPhone, businessEmail,
  footerText, cashierName
}: any) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-KE', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

  return (
    <div className="receipt-print-area" style={{ fontFamily: "'Courier New', monospace" }}>
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px' }}>{businessName}</div>
        {businessAddress && <div style={{ fontSize: '10px', marginTop: '2px' }}>{businessAddress}</div>}
        {businessPhone && <div style={{ fontSize: '10px' }}>Tel: {businessPhone}</div>}
        {businessEmail && <div style={{ fontSize: '10px' }}>{businessEmail}</div>}
      </div>

      {/* Receipt info */}
      <div style={{ fontSize: '10px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Receipt No:</span>
          <span style={{ fontWeight: 'bold' }}>{sale.receipt_number || sale.receipt_pin}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Date:</span>
          <span>{formatDate(sale.created_at)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Cashier:</span>
          <span>{cashierName}</span>
        </div>
      </div>

      {/* Items */}
      <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', marginBottom: '8px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>ITEMS</div>
        {items.map((item: any, i: number) => (
          <div key={i} style={{ marginBottom: '4px', fontSize: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ flex: 1, marginRight: '8px' }}>{item.name || item.products?.name || 'Product'}</span>
              <span style={{ fontWeight: 'bold' }}>KES {(item.price * item.quantity).toLocaleString()}</span>
            </div>
            <div style={{ color: '#555' }}>{item.quantity} x KES {Number(item.price).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ fontSize: '10px', marginBottom: '8px' }}>
        {sale.discount_amount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Discount:</span>
            <span>-KES {Number(sale.discount_amount).toLocaleString()}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', borderTop: '1px solid #000', paddingTop: '4px', marginTop: '4px' }}>
          <span>TOTAL</span>
          <span>KES {Number(sale.total_amount).toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span>Payment:</span>
          <span style={{ textTransform: 'capitalize' }}>{sale.payment_method?.replace('_', ' ')}</span>
        </div>
        {sale.payment_method === 'mixed' && (
          <div style={{ paddingLeft: '8px', color: '#444' }}>
            {sale.cash_amount > 0 && <div>Cash: KES {Number(sale.cash_amount).toLocaleString()}</div>}
            {sale.mpesa_amount > 0 && <div>M-Pesa: KES {Number(sale.mpesa_amount).toLocaleString()}</div>}
            {sale.card_amount > 0 && <div>Card: KES {Number(sale.card_amount).toLocaleString()}</div>}
            {sale.bank_amount > 0 && <div>Bank: KES {Number(sale.bank_amount).toLocaleString()}</div>}
          </div>
        )}
      </div>

      {sale.notes && (
        <div style={{ fontSize: '10px', borderTop: '1px dashed #000', paddingTop: '6px', marginBottom: '8px' }}>
          <strong>Notes:</strong> {sale.notes}
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', borderTop: '1px dashed #000', paddingTop: '8px', fontSize: '10px' }}>
        <div style={{ fontWeight: 'bold' }}>{footerText}</div>
        <div>Keep this receipt for returns</div>
        <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '11px', letterSpacing: '2px' }}>
          PIN: {sale.receipt_pin}
        </div>
        <div style={{ marginTop: '8px', fontSize: '9px', color: '#777' }}>*** Smart POS ***</div>
      </div>
    </div>
  )
}

export default function Receipt({
  sale, items,
  shopName = 'SMART POS',
  shopAddress = '',
  shopPhone = '',
  shopEmail = '',
  cashierName = 'Cashier',
  receiptFooter = 'Thank you for your purchase!'
}: ReceiptProps) {
  const [settings, setSettings] = useState<any>(null)
  const [thermalPrinter, setThermalPrinter] = useState<ThermalPrinter | null>(null)
  const [printerConnected, setPrinterConnected] = useState(false)
  const [showPrinterOptions, setShowPrinterOptions] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)

  useEffect(() => {
    loadSettings()
    // Create/ensure portal div
    let el = document.getElementById('print-receipt-portal')
    if (!el) {
      el = document.createElement('div')
      el.id = 'print-receipt-portal'
      el.style.display = 'none'
      document.body.appendChild(el)
    }
    setPortalEl(el)
    return () => {
      if (el) el.style.display = 'none'
    }
  }, [])

  const loadSettings = async () => {
    try {
      const { getSettingByKey } = await import('@/lib/indexeddb')
      const businessSettings = await getSettingByKey('business')
      const receiptSettings = await getSettingByKey('receipt')
      setSettings({
        business: businessSettings?.value,
        receipt: receiptSettings?.value
      })
    } catch (_) {}
  }

  const businessName = settings?.business?.name || shopName
  const businessAddress = settings?.business?.address || shopAddress
  const businessPhone = settings?.business?.phone || shopPhone
  const businessEmail = settings?.business?.email || shopEmail
  const footerText = settings?.receipt?.footer || receiptFooter

  const receiptProps = { sale, items, businessName, businessAddress, businessPhone, businessEmail, footerText, cashierName }

  const handleBrowserPrint = () => {
    if (!portalEl) return
    setPrinting(true)
    portalEl.style.display = 'block'
    setTimeout(() => {
      window.print()
      setTimeout(() => {
        portalEl.style.display = 'none'
        setPrinting(false)
      }, 500)
    }, 100)
  }

  const connectUSB = async () => {
    const p = new ThermalPrinter()
    if (await p.connectUSB()) {
      setThermalPrinter(p); setPrinterConnected(true); setShowPrinterOptions(false)
    } else alert('USB printer connection failed')
  }

  const connectBluetooth = async () => {
    const p = new ThermalPrinter()
    if (await p.connectBluetooth()) {
      setThermalPrinter(p); setPrinterConnected(true); setShowPrinterOptions(false)
    } else alert('Bluetooth printer connection failed')
  }

  const printThermal = async () => {
    if (!thermalPrinter) return
    const ok = await thermalPrinter.printReceipt({
      shopName: businessName, shopAddress: businessAddress, shopPhone: businessPhone,
      receiptPin: sale.receipt_pin, receiptNumber: sale.receipt_number,
      created_at: sale.created_at, cashierName,
      payment_method: sale.payment_method, total_amount: sale.total_amount,
      discount_amount: sale.discount_amount, cash_amount: sale.cash_amount,
      mpesa_amount: sale.mpesa_amount, card_amount: sale.card_amount,
      bank_amount: sale.bank_amount, notes: sale.notes, receiptFooter: footerText
    }, items)
    if (ok) { alert('Printed successfully') } else { alert('Print failed') }
  }

  const disconnect = async () => {
    if (thermalPrinter) { await thermalPrinter.disconnect(); setThermalPrinter(null); setPrinterConnected(false) }
  }

  return (
    <div className="space-y-4">
      {/* Print buttons */}
      <div className="flex flex-wrap gap-2">
        <button onClick={handleBrowserPrint} disabled={printing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
          <Printer className="w-4 h-4" />
          {printing ? 'Printing...' : 'Print Receipt'}
        </button>

        {!printerConnected ? (
          <button onClick={() => setShowPrinterOptions(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
            <Printer className="w-4 h-4" />
            Thermal Printer
          </button>
        ) : (
          <>
            <button onClick={printThermal}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
              <Printer className="w-4 h-4" /> Print Thermal
            </button>
            <button onClick={disconnect}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm font-medium">
              <X className="w-4 h-4" /> Disconnect
            </button>
          </>
        )}
      </div>

      {/* Thermal options */}
      {showPrinterOptions && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-purple-900">Connect Thermal Printer</p>
          <div className="flex gap-3">
            <button onClick={connectUSB}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 text-sm font-medium">
              <Usb className="w-4 h-4" /> USB Printer
            </button>
            <button onClick={connectBluetooth}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 text-sm font-medium">
              <Bluetooth className="w-4 h-4" /> Bluetooth Printer
            </button>
          </div>
          <p className="text-xs text-purple-600">Requires HTTPS and browser WebUSB/WebBluetooth support</p>
        </div>
      )}

      {/* Receipt preview */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 max-w-xs mx-auto shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-3 text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-medium">Receipt Preview</span>
        </div>

        {/* Visual receipt */}
        <div className="font-mono text-[11px] text-gray-800 leading-relaxed">
          <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
            <div className="font-bold text-sm tracking-wide">{businessName}</div>
            {businessAddress && <div className="text-gray-500">{businessAddress}</div>}
            {businessPhone && <div className="text-gray-500">Tel: {businessPhone}</div>}
            {businessEmail && <div className="text-gray-500">{businessEmail}</div>}
          </div>

          <div className="space-y-0.5 mb-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Receipt:</span>
              <span className="font-semibold">{sale.receipt_number || sale.receipt_pin}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date:</span>
              <span>{new Date(sale.created_at).toLocaleDateString('en-KE')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cashier:</span>
              <span>{cashierName}</span>
            </div>
          </div>

          <div className="border-t border-b border-dashed border-gray-400 py-2 mb-2">
            <div className="font-bold mb-1">ITEMS</div>
            {items.map((item: any, i: number) => (
              <div key={i} className="mb-1.5">
                <div className="flex justify-between">
                  <span className="flex-1 mr-2 truncate">{item.name || 'Product'}</span>
                  <span className="font-semibold">KES {(item.price * item.quantity).toLocaleString()}</span>
                </div>
                <div className="text-gray-400">{item.quantity} × KES {Number(item.price).toLocaleString()}</div>
              </div>
            ))}
          </div>

          {sale.discount_amount > 0 && (
            <div className="flex justify-between text-green-700 mb-1">
              <span>Discount:</span>
              <span>-KES {Number(sale.discount_amount).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1 mt-1 mb-2">
            <span>TOTAL</span>
            <span>KES {Number(sale.total_amount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-gray-500">Payment:</span>
            <span className="capitalize font-medium">{sale.payment_method?.replace('_', ' ')}</span>
          </div>

          <div className="text-center border-t border-dashed border-gray-400 pt-2 text-gray-500">
            <div className="font-semibold text-gray-700">{footerText}</div>
            <div>Keep this receipt for returns</div>
            <div className="font-bold text-gray-800 tracking-widest mt-1">PIN: {sale.receipt_pin}</div>
          </div>
        </div>
      </div>

      {/* Portal for printing */}
      {portalEl && createPortal(
        <ReceiptContent {...receiptProps} />,
        portalEl
      )}
    </div>
  )
}
