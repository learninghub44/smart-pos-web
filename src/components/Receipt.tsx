'use client'

import { useRef, useEffect, useState } from 'react'
import { useReactToPrint } from 'react-to-print'

interface ReceiptProps {
  sale: any
  items: any[]
  products?: any[]
  shopName?: string
  shopAddress?: string
  shopPhone?: string
  shopEmail?: string
  cashierName?: string
  receiptFooter?: string
  change?: number
}

export default function Receipt({
  sale,
  items,
  products = [],
  shopName = 'SMART POS',
  shopAddress = '',
  shopPhone = '',
  shopEmail = '',
  cashierName = 'Cashier',
  receiptFooter,
  change = 0
}: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { getSettingByKey } = await import('@/lib/indexeddb')
      const business = await getSettingByKey('business')
      const receipt = await getSettingByKey('receipt')
      setSettings({ business: business?.value, receipt: receipt?.value })
    } catch {}
  }

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    pageStyle: `
      @media print {
        @page { size: 80mm auto; margin: 0; }
        body { margin: 0; padding: 0; }
        #receipt { width: 72mm; padding: 4mm; font-family: 'Courier New', monospace; font-size: 11px; }
      }
    `
  })

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-KE', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

  const bizName = settings?.business?.name || shopName
  const bizAddress = settings?.business?.address || shopAddress
  const bizPhone = settings?.business?.phone || shopPhone
  const bizEmail = settings?.business?.email || shopEmail
  const footer = settings?.receipt?.footer || receiptFooter || 'Thank you for your business!'

  // Resolve product names from items (items may have product_name or product_id)
  const getItemName = (item: any) => {
    if (item.product_name) return item.product_name
    if (item.products?.name) return item.products.name
    if (item.product_id && products.length > 0) {
      const p = products.find((p: any) => p.id === item.product_id)
      if (p) return p.name
    }
    return item.name || 'Product'
  }

  return (
    <div id="receipt" ref={receiptRef} className="p-4 bg-white font-mono text-xs">
      {/* Header */}
      <div className="text-center mb-3 pb-3 border-b border-dashed border-gray-400">
        <p className="font-bold text-base uppercase tracking-wider">{bizName}</p>
        {bizAddress && <p className="text-gray-600 text-xs mt-0.5">{bizAddress}</p>}
        {bizPhone && <p className="text-gray-600 text-xs">Tel: {bizPhone}</p>}
        {bizEmail && <p className="text-gray-600 text-xs">{bizEmail}</p>}
      </div>

      {/* Meta */}
      <div className="mb-3 space-y-0.5">
        <div className="flex justify-between">
          <span className="text-gray-500">Receipt:</span>
          <span className="font-semibold">{sale.receipt_number || sale.receipt_pin}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">PIN:</span>
          <span className="font-bold">{sale.receipt_pin}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Date:</span>
          <span>{formatDate(sale.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Cashier:</span>
          <span>{cashierName}</span>
        </div>
      </div>

      {/* Items */}
      <div className="border-t border-b border-dashed border-gray-400 py-2 mb-3 space-y-1.5">
        <p className="font-bold mb-1.5">ITEMS</p>
        {items.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between">
              <span className="flex-1 pr-2 font-medium leading-tight">{getItemName(item)}</span>
              <span className="font-bold">KES {(item.price * item.quantity).toLocaleString()}</span>
            </div>
            <div className="text-gray-500 text-xs">
              {item.quantity} × KES {Number(item.price).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-0.5 mb-3">
        {Number(sale.discount_amount) > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Discount:</span>
            <span>-KES {Number(sale.discount_amount).toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm border-t border-dashed border-gray-400 pt-1 mt-1">
          <span>TOTAL</span>
          <span>KES {Number(sale.total_amount).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Payment:</span>
          <span className="capitalize font-medium">{sale.payment_method?.replace(/_/g, ' ')}</span>
        </div>
        {sale.payment_method === 'cash' && Number(sale.cash_amount) > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Cash Given:</span>
            <span>KES {Number(sale.cash_amount).toLocaleString()}</span>
          </div>
        )}
        {change > 0 && (
          <div className="flex justify-between font-semibold text-green-700">
            <span>Change:</span>
            <span>KES {change.toLocaleString()}</span>
          </div>
        )}
        {sale.payment_method === 'mixed' && (
          <div className="text-gray-500 text-xs mt-1 space-y-0.5">
            {Number(sale.cash_amount) > 0 && <div className="flex justify-between"><span>Cash:</span><span>KES {Number(sale.cash_amount).toLocaleString()}</span></div>}
            {Number(sale.mpesa_amount) > 0 && <div className="flex justify-between"><span>M-Pesa:</span><span>KES {Number(sale.mpesa_amount).toLocaleString()}</span></div>}
            {Number(sale.card_amount) > 0 && <div className="flex justify-between"><span>Card:</span><span>KES {Number(sale.card_amount).toLocaleString()}</span></div>}
            {Number(sale.bank_amount) > 0 && <div className="flex justify-between"><span>Bank:</span><span>KES {Number(sale.bank_amount).toLocaleString()}</span></div>}
            {Number(sale.credit_amount) > 0 && <div className="flex justify-between"><span>Credit:</span><span>KES {Number(sale.credit_amount).toLocaleString()}</span></div>}
          </div>
        )}
      </div>

      {/* Notes */}
      {sale.notes && (
        <div className="border-t border-dashed border-gray-300 pt-2 mb-3 text-gray-600 text-xs">
          <span className="font-medium">Note:</span> {sale.notes}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-dashed border-gray-400 pt-2 text-center text-gray-500 text-xs">
        <p className="font-medium">{footer}</p>
        <p className="mt-1">Keep receipt for returns/exchanges</p>
        <p className="font-bold mt-1">PIN: {sale.receipt_pin}</p>
      </div>
    </div>
  )
}
