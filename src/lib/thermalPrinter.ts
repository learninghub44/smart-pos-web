// Thermal Printer Utility with ESC/POS Support
// Supports WebUSB and WebBluetooth APIs for direct thermal printer communication

export interface ThermalPrinterConfig {
  width?: number // Paper width in mm (default: 80)
  characterSet?: string // Character encoding (default: 'CP437')
  density?: number // Print density (0-8, default: 8)
  baudRate?: number // For Bluetooth printers (default: 115200)
}

export interface PrinterDevice {
  type: 'usb' | 'bluetooth' | 'network'
  device: any
  name: string
  id: string
}

class ThermalPrinter {
  private device: any = null
  private config: ThermalPrinterConfig
  private encoder: TextEncoder

  constructor(config: ThermalPrinterConfig = {}) {
    this.config = {
      width: config.width || 80,
      characterSet: config.characterSet || 'CP437',
      density: config.density || 8,
      baudRate: config.baudRate || 115200
    }
    this.encoder = new TextEncoder()
  }

  // ESC/POS Commands
  private readonly ESC = '\x1B'
  private readonly GS = '\x1D'

  // Initialize printer
  private init(): Uint8Array {
    const commands = []
    // Reset printer
    commands.push(...this.toBytes(this.ESC + '@'))
    // Set character set
    commands.push(...this.toBytes(this.ESC + '\x74' + '\x00'))
    // Set print density
    commands.push(...this.toBytes(this.ESC + '\x74' + String.fromCharCode(this.config.density!)))
    return new Uint8Array(commands)
  }

  // Set alignment
  private setAlignment(alignment: 'left' | 'center' | 'right'): Uint8Array {
    const alignMap = { left: '\x00', center: '\x01', right: '\x02' }
    return this.toBytes(this.ESC + '\x61' + alignMap[alignment])
  }

  // Set text size
  private setTextSize(width: number, height: number): Uint8Array {
    const size = ((width - 1) << 4) | (height - 1)
    return this.toBytes(this.GS + '\x21' + String.fromCharCode(size))
  }

  // Set bold mode
  private setBold(enabled: boolean): Uint8Array {
    return this.toBytes(this.ESC + '\x45' + (enabled ? '\x01' : '\x00'))
  }

  // Set underline
  private setUnderline(enabled: boolean): Uint8Array {
    return this.toBytes(this.ESC + '\x2D' + (enabled ? '\x01' : '\x00'))
  }

  // Feed lines
  private feedLines(lines: number): Uint8Array {
    return this.toBytes(this.ESC + '\x64' + String.fromCharCode(lines))
  }

  // Cut paper
  private cutPaper(fullCut: boolean = true): Uint8Array {
    return this.toBytes(this.GS + '\x56' + (fullCut ? '\x00' : '\x01'))
  }

  // Convert string to bytes
  private toBytes(str: string): number[] {
    return Array.from(this.encoder.encode(str))
  }

  // Format receipt data
  private formatReceipt(receipt: any, items: any[]): Uint8Array {
    const commands: number[] = []
    
    // Initialize
    commands.push(...this.init())
    
    // Center align header
    commands.push(...this.setAlignment('center'))
    commands.push(...this.setBold(true))
    commands.push(...this.setTextSize(2, 2))
    commands.push(...this.toBytes(receipt.shopName + '\n'))
    commands.push(...this.setTextSize(1, 1))
    commands.push(...this.setBold(false))
    
    if (receipt.shopAddress) {
      commands.push(...this.toBytes(receipt.shopAddress + '\n'))
    }
    if (receipt.shopPhone) {
      commands.push(...this.toBytes('Tel: ' + receipt.shopPhone + '\n'))
    }
    
    commands.push(...this.feedLines(1))
    
    // Left align receipt info
    commands.push(...this.setAlignment('left'))
    commands.push(...this.setBold(true))
    commands.push(...this.toBytes('Receipt No: ' + (receipt.receipt_number || receipt.receipt_pin) + '\n'))
    commands.push(...this.setBold(false))
    commands.push(...this.toBytes('Receipt PIN: ' + receipt.receipt_pin + '\n'))
    commands.push(...this.toBytes('Date: ' + new Date(receipt.created_at).toLocaleString() + '\n'))
    commands.push(...this.toBytes('Cashier: ' + receipt.cashierName + '\n'))
    
    commands.push(...this.setUnderline(true))
    commands.push(...this.toBytes('-'.repeat(32) + '\n'))
    commands.push(...this.setUnderline(false))
    
    // Items
    commands.push(...this.setBold(true))
    commands.push(...this.toBytes('ITEMS\n'))
    commands.push(...this.setBold(false))
    
    items.forEach(item => {
      const name = item.name || item.products?.name || 'Product'
      const qty = item.quantity
      const price = item.price
      const total = price * qty
      
      commands.push(...this.toBytes(`${name}\n`))
      commands.push(...this.toBytes(`  ${qty} x KES ${price.toLocaleString()} = KES ${total.toLocaleString()}\n`))
    })
    
    commands.push(...this.setUnderline(true))
    commands.push(...this.toBytes('-'.repeat(32) + '\n'))
    commands.push(...this.setUnderline(false))
    
    // Totals
    if (receipt.discount_amount > 0) {
      commands.push(...this.toBytes(`Discount: -KES ${receipt.discount_amount.toLocaleString()}\n`))
    }
    
    commands.push(...this.setBold(true))
    commands.push(...this.setTextSize(2, 2))
    commands.push(...this.toBytes(`TOTAL: KES ${receipt.total_amount.toLocaleString()}\n`))
    commands.push(...this.setTextSize(1, 1))
    commands.push(...this.setBold(false))
    
    commands.push(...this.toBytes(`Payment: ${receipt.payment_method.replace('_', ' ')}\n`))
    
    // Mixed payment breakdown
    if (receipt.payment_method === 'mixed') {
      if (receipt.cash_amount > 0) {
        commands.push(...this.toBytes(`  Cash: KES ${receipt.cash_amount.toLocaleString()}\n`))
      }
      if (receipt.mpesa_amount > 0) {
        commands.push(...this.toBytes(`  M-Pesa: KES ${receipt.mpesa_amount.toLocaleString()}\n`))
      }
      if (receipt.card_amount > 0) {
        commands.push(...this.toBytes(`  Card: KES ${receipt.card_amount.toLocaleString()}\n`))
      }
      if (receipt.bank_amount > 0) {
        commands.push(...this.toBytes(`  Bank: KES ${receipt.bank_amount.toLocaleString()}\n`))
      }
    }
    
    if (receipt.notes) {
      commands.push(...this.feedLines(1))
      commands.push(...this.toBytes(`Notes: ${receipt.notes}\n`))
    }
    
    commands.push(...this.feedLines(2))
    
    // Footer
    commands.push(...this.setAlignment('center'))
    commands.push(...this.toBytes(receipt.receiptFooter || 'Thank you for your purchase!\n'))
    commands.push(...this.toBytes('Keep this receipt for returns\n'))
    commands.push(...this.toBytes(`Receipt PIN: ${receipt.receipt_pin}\n`))
    
    commands.push(...this.feedLines(3))
    commands.push(...this.cutPaper(true))
    
    return new Uint8Array(commands)
  }

  // Connect to USB printer
  async connectUSB(): Promise<boolean> {
    try {
      if (!navigator.usb) {
        throw new Error('WebUSB not supported')
      }

      const device = await navigator.usb.requestDevice({ filters: [{ vendorId: 0x0456 }] })
      await device.open()
      await device.selectConfiguration(1)
      await device.claimInterface(0)
      
      this.device = { type: 'usb', device }
      return true
    } catch (error) {
      console.error('USB connection failed:', error)
      return false
    }
  }

  // Connect to Bluetooth printer
  async connectBluetooth(): Promise<boolean> {
    try {
      if (!navigator.bluetooth) {
        throw new Error('WebBluetooth not supported')
      }

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }] // Serial Port Profile
      })
      
      const server = await device.gatt.connect()
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb')
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb')
      
      this.device = { type: 'bluetooth', device, characteristic }
      return true
    } catch (error) {
      console.error('Bluetooth connection failed:', error)
      return false
    }
  }

  // Print receipt
  async printReceipt(receipt: any, items: any[]): Promise<boolean> {
    if (!this.device) {
      throw new Error('No printer connected')
    }

    try {
      const data = this.formatReceipt(receipt, items)
      
      if (this.device.type === 'usb') {
        await this.device.device.transferOut(1, data)
      } else if (this.device.type === 'bluetooth') {
        // Send data in chunks for Bluetooth
        const chunkSize = 512
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize)
          await this.device.characteristic.writeValue(chunk)
        }
      }
      
      return true
    } catch (error) {
      console.error('Print failed:', error)
      return false
    }
  }

  // Disconnect printer
  async disconnect(): Promise<void> {
    if (!this.device) return

    try {
      if (this.device.type === 'usb') {
        await this.device.device.close()
      } else if (this.device.type === 'bluetooth') {
        await this.device.device.gatt.disconnect()
      }
      this.device = null
    } catch (error) {
      console.error('Disconnect failed:', error)
    }
  }

  // Check if printer is connected
  isConnected(): boolean {
    return this.device !== null
  }

  // Get available printers
  static async getAvailablePrinters(): Promise<PrinterDevice[]> {
    const printers: PrinterDevice[] = []

    // Check for USB devices
    if (navigator.usb) {
      try {
        const devices = await navigator.usb.getDevices()
        devices.forEach(device => {
          printers.push({
            type: 'usb',
            device,
            name: device.productName || 'USB Printer',
            id: device.serialNumber || device.deviceId
          })
        })
      } catch (error) {
        console.error('Failed to get USB devices:', error)
      }
    }

    return printers
  }
}

export default ThermalPrinter
