import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const barcode = searchParams.get('barcode')

  if (!barcode) {
    return new Response(JSON.stringify({ error: 'Barcode required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'RiseApp/1.0' } }
    )

    const data = await response.json()

    if (data.status !== 1 || !data.product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const p = data.product
    const nutriments = p.nutriments || {}

    const serving100g = 100
    const servingGrams = p.serving_quantity
      ? parseFloat(p.serving_quantity)
      : serving100g

    const result = {
      name: p.product_name || p.product_name_en || 'Unknown Product',
      brand: p.brands || '',
      servingSize: servingGrams,
      servingLabel: p.serving_size || `${servingGrams}g`,
      calories: Math.round((nutriments['energy-kcal_100g'] || 0) * (servingGrams / 100)),
      protein: Math.round(((nutriments.proteins_100g || 0) * (servingGrams / 100)) * 10) / 10,
      carbs: Math.round(((nutriments.carbohydrates_100g || 0) * (servingGrams / 100)) * 10) / 10,
      fats: Math.round(((nutriments.fat_100g || 0) * (servingGrams / 100)) * 10) / 10,
      imageUrl: p.image_front_small_url || p.image_url || null,
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch product' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}