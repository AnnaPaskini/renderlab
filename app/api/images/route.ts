// app/api/images/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Создаём Supabase клиента с async cookies (Next.js 16)
async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

// GET: получить все изображения текущего юзера
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Проверяем авторизацию
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Получаем изображения юзера (сортировка по дате, новые первые)
    const { data: images, error: dbError } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch images', details: dbError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ images })
    
  } catch (error) {
    console.error('GET /api/images error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: сохранить метаданные изображения после генерации
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Проверяем авторизацию
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Парсим тело запроса
    const body = await request.json()
    const { name, url } = body

    // Валидация
    if (!name || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: name and url' },
        { status: 400 }
      )
    }

    // Вставляем запись в таблицу images
    const { data: image, error: dbError } = await supabase
      .from('images')
      .insert({
        user_id: user.id,
        name: name,
        url: url,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save image', details: dbError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ image }, { status: 201 })
    
  } catch (error) {
    console.error('POST /api/images error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
