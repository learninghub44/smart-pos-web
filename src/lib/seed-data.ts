import { addProductToDB } from './indexeddb'

export async function seedSampleData() {
  const sampleProducts = [
    {
      id: crypto.randomUUID(),
      name: 'Bread (400g)',
      barcode: '1001',
      buying_price: 200,
      selling_price: 250,
      stock: 50,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Milk (500ml)',
      barcode: '1002',
      buying_price: 250,
      selling_price: 300,
      stock: 35,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Sugar (1kg)',
      barcode: '1003',
      buying_price: 550,
      selling_price: 600,
      stock: 25,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Cooking Oil (1L)',
      barcode: '1004',
      buying_price: 750,
      selling_price: 800,
      stock: 20,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Rice (2kg)',
      barcode: '1005',
      buying_price: 700,
      selling_price: 800,
      stock: 18,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Maize Flour (2kg)',
      barcode: '1006',
      buying_price: 180,
      selling_price: 200,
      stock: 40,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Salt (500g)',
      barcode: '1007',
      buying_price: 50,
      selling_price: 70,
      stock: 60,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Tea Leaves (250g)',
      barcode: '1008',
      buying_price: 150,
      selling_price: 180,
      stock: 30,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Soap (Bar)',
      barcode: '1009',
      buying_price: 80,
      selling_price: 100,
      stock: 45,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Toothpaste (100ml)',
      barcode: '1010',
      buying_price: 120,
      selling_price: 150,
      stock: 25,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Biscuits (Packet)',
      barcode: '1011',
      buying_price: 80,
      selling_price: 100,
      stock: 35,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Soda (500ml)',
      barcode: '1012',
      buying_price: 40,
      selling_price: 50,
      stock: 80,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Water (1L)',
      barcode: '1013',
      buying_price: 30,
      selling_price: 50,
      stock: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Eggs (Tray)',
      barcode: '1014',
      buying_price: 350,
      selling_price: 400,
      stock: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Tomatoes (1kg)',
      barcode: '1015',
      buying_price: 80,
      selling_price: 100,
      stock: 20,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Onions (1kg)',
      barcode: '1016',
      buying_price: 60,
      selling_price: 80,
      stock: 25,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Potatoes (1kg)',
      barcode: '1017',
      buying_price: 70,
      selling_price: 90,
      stock: 30,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Cabbage (1pc)',
      barcode: '1018',
      buying_price: 50,
      selling_price: 70,
      stock: 22,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Bananas (1kg)',
      barcode: '1019',
      buying_price: 90,
      selling_price: 120,
      stock: 18,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Orange Juice (1L)',
      barcode: '1020',
      buying_price: 200,
      selling_price: 250,
      stock: 28,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  for (const product of sampleProducts) {
    await addProductToDB(product)
  }

  console.log('Sample data seeded successfully')
  return sampleProducts.length
}
