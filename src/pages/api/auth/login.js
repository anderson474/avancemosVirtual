// pages/api/auth/login.js
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos.' })
  }

  // Crea un cliente de Supabase para el lado del servidor.
  // Es crucial porque maneja las cookies de sesión de forma segura.
  const supabase = createPagesServerClient({ req, res })

  // 1. Iniciar sesión con Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    console.error('Error de autenticación de Supabase:', authError.message)
    // Devuelve un mensaje genérico por seguridad
    return res.status(401).json({ error: 'Credenciales inválidas.' })
  }

  if (!authData.user) {
    return res.status(401).json({ error: 'No se pudo autenticar al usuario.' })
  }

  // 2. Obtener el rol del usuario desde la tabla 'perfiles'
  // El usuario ya está en sesión, así que podemos obtener su ID.
  const { data: profileData, error: profileError } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', authData.user.id)
    .single() // .single() espera un solo resultado y lo devuelve como objeto

  if (profileError || !profileData) {
    // Esto puede pasar si el perfil no se creó correctamente
    console.error('Error al buscar el perfil:', profileError?.message)
    return res.status(500).json({ error: 'No se pudo encontrar el rol del usuario.' })
  }

  // 3. Devolver el rol para que el frontend pueda redirigir
  // El helper de Supabase ya se encargó de establecer la cookie de sesión.
  return res.status(200).json({ rol: profileData.rol })
}
