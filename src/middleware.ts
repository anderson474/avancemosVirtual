import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log('--- MIDDLEWARE EJECUTÁNDOSE ---')
  console.log('Ruta solicitada:', req.nextUrl.pathname)

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()
  
  // ----> LOG PARA LA SESIÓN <----
  // JSON.stringify es para ver el objeto completo de forma legible
  console.log('Sesión obtenida:', JSON.stringify(session, null, 2))

  if (!session) {
    console.log('>>> NO HAY SESIÓN. Redirigiendo a /login...')
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/acceso-denegado'
    redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // --- LÓGICA DE ROLES ---
  console.log(`Buscando perfil para el usuario con ID: ${session.user.id}`)

  const { data: perfil, error } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', session.user.id)
    .single()

  // ----> LOGS PARA EL PERFIL Y ROL <----
  if (error) {
    console.error('Error al buscar el perfil:', error.message)
  }
  console.log('Perfil obtenido de la BD:', perfil)

  if (!perfil || !perfil.rol) {
    console.log('>>> NO SE ENCONTRÓ PERFIL O ROL. Redirigiendo a /login con error...')
    return NextResponse.redirect(new URL('/login?error=no_profile', req.url))
  }

  const userRole = perfil.rol
  console.log(`Rol del usuario: ${userRole}`)

  // ----> LOG PARA LAS REGLAS DE ACCESO <----
  const isAdminRoute = req.nextUrl.pathname.startsWith('/Dashboard/admin')
  const isDocenteRoute = req.nextUrl.pathname.startsWith('/Dashboard/docente')
  const isAlumnoRoute = req.nextUrl.pathname.startsWith('/Dashboard/alumno')
  console.log(`Verificando acceso a ruta de docente: ${isDocenteRoute}, rol del usuario: ${userRole}`)

  if (isAdminRoute && userRole !== 'admin') {
    console.log(`>>> ACCESO DENEGADO a ruta de admin para rol '${userRole}'. Redirigiendo...`)
    return NextResponse.redirect(new URL('/acceso-denegado', req.url))
  }
  if (isDocenteRoute && userRole !== 'docente') {
    console.log(`>>> ACCESO DENEGADO a ruta de docente para rol '${userRole}'. Redirigiendo...`)
    return NextResponse.redirect(new URL('/acceso-denegado', req.url))
  }
  if (isAlumnoRoute && userRole !== 'alumno') {
    console.log(`>>> ACCESO DENEGADO a ruta de alumno para rol '${userRole}'. Redirigiendo...`)
    return NextResponse.redirect(new URL('/acceso-denegado', req.url))
  }

  console.log('--- ACCESO PERMITIDO. Dejando pasar. ---')
  return res
}

// ----> REEMPLAZA TU CONFIG ACTUAL POR ESTA <----
export const config = {
  // Ejecuta el middleware ÚNICAMENTE en las rutas que coincidan con este patrón.
  // '/Dashboard/:path*' significa:
  // - La ruta exacta '/Dashboard' (si existiera)
  // - Cualquier ruta anidada, como '/Dashboard/docente', '/Dashboard/admin/usuarios', etc.
  // NO se ejecutará en '/', '/login', ni en ninguna otra ruta que no empiece con '/Dashboard'.
  matcher: ['/Dashboard/:path*'],
}