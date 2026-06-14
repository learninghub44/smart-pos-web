# SMART POS Web System

A modern, offline-first Point of Sale system designed for Kenyan shops. Built with Next.js, Supabase, and Tailwind CSS.

## Features

- **🛒 Complete POS System**: Product search, cart management, and checkout
- **📦 Inventory Management**: Add, edit, delete products with stock tracking
- **🧾 Receipt System**: Thermal printer support with unique receipt PIN verification
- **🔳 Barcode Scanning**: Support for USB scanners and camera-based scanning
- **💳 Payment Tracking**: Cash, M-Pesa, and mixed payment methods
- **📊 Dashboard**: Sales analytics, revenue tracking, and low stock alerts
- **📶 Offline-First**: Works without internet, syncs when connection is restored
- **🔐 Role-Based Access**: Admin and cashier roles with secure authentication
- **🖨️ Thermal Printing**: Optimized for 58mm and 80mm thermal printers

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Offline Storage**: IndexedDB
- **Deployment**: Vercel
- **Icons**: Lucide React
- **Charts**: Recharts
- **Printing**: react-to-print

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd smart-pos-web
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor in Supabase dashboard
   - Run the SQL schema from `supabase/schema.sql`

4. Configure environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_NAME=SMART POS
   NEXT_PUBLIC_SHOP_NAME=Your Shop Name
   ```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Demo Credentials

The system comes with demo credentials for testing:

- **Admin**: admin@smartpos.com / admin123
- **Cashier**: cashier@smartpos.com / cashier123

## Usage

### First Time Setup

1. Login with admin credentials
2. Go to Inventory page
3. Click "Seed Sample Data" to add sample products
4. Start using the POS system

### Making a Sale

1. Go to POS page
2. Search products by name or scan barcode
3. Add items to cart
4. Click Checkout
5. Select payment method (Cash, M-Pesa, or Mixed)
6. Complete sale and print receipt

### Managing Inventory

1. Go to Inventory page
2. Add new products with name, barcode, prices, and stock
3. Edit existing products
4. Delete products
5. Monitor low stock alerts

### Verifying Receipts

1. Go to Receipts page
2. Enter the Receipt PIN
3. View receipt details
4. Print if needed for returns/exchanges

## Database Schema

The system uses the following tables:

- `users`: User accounts with roles (admin/cashier)
- `products`: Product inventory with pricing and stock
- `sales`: Sales transactions with receipt PINs
- `sale_items`: Individual items in each sale
- `inventory_logs`: Stock change history
- `offline_queue`: Queued actions for offline sync

## Offline Functionality

The system works offline using IndexedDB:

- All products cached locally
- Sales queued when offline
- Automatic sync when internet returns
- No data loss during disconnection

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_NAME` (optional)
- `NEXT_PUBLIC_SHOP_NAME` (optional)

## Thermal Printer Setup

The system supports thermal printers:

- 58mm thermal printers
- 80mm thermal printers (recommended)
- Browser print dialog
- ESC/POS compatible

## Security

- Supabase Row Level Security (RLS) enabled
- Role-based access control
- Secure authentication
- Data encryption in transit

## Performance Goals

- POS loads < 2 seconds
- Works on low-end phones
- Offline fully functional
- Fast checkout (<2 seconds)
- Reliable thermal printing

## Troubleshooting

### Barcode Scanner Not Working
- Ensure USB scanner is properly connected
- Check if scanner is in keyboard mode
- Try the manual barcode input option

### Offline Sync Issues
- Check internet connection
- Verify Supabase credentials
- Check browser console for errors

### Printing Issues
- Ensure printer is connected
- Check browser print settings
- Try different paper size (58mm/80mm)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.
