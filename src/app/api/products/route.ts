import { NextRequest } from 'next/server'
import { requireAuth, ok, err } from '@/lib/api-helper'
import { query, queryOne } from '@/lib/db'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth

  const url = new URL(req.url)
  const archived = url.searchParams.get('archived') === 'true'
  const inStock = url.searchParams.get('in_stock') === 'true'

  let sql = `SELECT p.*, c.name as category, b.name as brand, s.name as supplier_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = $1
    LEFT JOIN brands b ON b.id = p.brand_id AND b.tenant_id = $1
    LEFT JOIN suppliers s ON s.id = p.supplier_id AND s.tenant_id = $1
    WHERE p.tenant_id = $1 AND p.archived = $2`
  const params: any[] = [user.tenant_id, archived]
  if (inStock) sql += ' AND p.stock > 0'
  sql += ' ORDER BY p.name'

  return ok(await query(sql, params))
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  if (user.role === 'cashier') return err('Forbidden', 403)
  const b = await req.json()
  const p = await queryOne(
    `INSERT INTO products (tenant_id,name,sku,barcode,category_id,brand_id,supplier_id,unit,cost_price,selling_price,tax_rate,stock,minimum_stock,image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [user.tenant_id,b.name,b.sku||null,b.barcode||null,b.category_id||null,b.brand_id||null,b.supplier_id||null,b.unit||null,
     b.cost_price||0,b.selling_price||0,b.tax_rate||0,b.stock||0,b.minimum_stock||10,b.image_url||null]
  )
  return ok(p, 201)
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  if (user.role === 'cashier') return err('Forbidden', 403)
  const b = await req.json()
  const p = await queryOne(
    `UPDATE products SET name=$2,sku=$3,barcode=$4,category_id=$5,brand_id=$6,supplier_id=$7,unit=$8,
     cost_price=$9,selling_price=$10,tax_rate=$11,stock=$12,minimum_stock=$13,image_url=$14,archived=$15,updated_at=NOW()
     WHERE id=$1 AND tenant_id=$16 RETURNING *`,
    [b.id,b.name,b.sku||null,b.barcode||null,b.category_id||null,b.brand_id||null,b.supplier_id||null,b.unit||null,
     b.cost_price||0,b.selling_price||0,b.tax_rate||0,b.stock||0,b.minimum_stock||10,b.image_url||null,b.archived??false,user.tenant_id]
  )
  return ok(p)
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  if (user.role === 'cashier') return err('Forbidden', 403)
  const { id } = await req.json()
  await query('UPDATE products SET archived=true WHERE id=$1 AND tenant_id=$2', [id, user.tenant_id])
  return ok({ success: true })
}
