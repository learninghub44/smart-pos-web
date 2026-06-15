// Auto-fill product details from barcode using public APIs
// Tries multiple sources: Open Food Facts, UPC Item DB (trial)

export interface ProductLookupResult {
  name?: string
  brand?: string
  category?: string
  unit?: string
  imageUrl?: string
  source?: string
}

export async function lookupBarcode(barcode: string): Promise<ProductLookupResult | null> {
  // Try Open Food Facts first (great for Kenya/East Africa grocery products)
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const data = await res.json()
      if (data.status === 1 && data.product) {
        const p = data.product
        const name = p.product_name_en || p.product_name || p.abbreviated_product_name || ''
        const brand = p.brands || ''
        const quantity = p.quantity || p.net_weight || ''
        const category = p.categories_tags?.[0]?.replace('en:', '').replace(/-/g, ' ') || ''
        const imageUrl = p.image_front_small_url || p.image_url || ''

        if (name) {
          return {
            name: brand && !name.toLowerCase().includes(brand.toLowerCase())
              ? `${brand} ${name}`.trim()
              : name.trim(),
            brand: brand.split(',')[0].trim(),
            category: category ? capitalize(category) : '',
            unit: quantity || '',
            imageUrl,
            source: 'Open Food Facts'
          }
        }
      }
    }
  } catch (_) {}

  // Try UPC Item DB (trial — limited requests but works for common products)
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const data = await res.json()
      const item = data.items?.[0]
      if (item?.title) {
        return {
          name: item.title,
          brand: item.brand || '',
          category: item.category || '',
          unit: item.size || item.weight || '',
          imageUrl: item.images?.[0] || '',
          source: 'UPC Item DB'
        }
      }
    }
  } catch (_) {}

  return null
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
