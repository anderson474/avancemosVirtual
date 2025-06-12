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

  const supabase = createPagesServerClient({ req, res })

  // 1. Iniciar sesión con Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    console.error('Error de autenticación de Supabase:', authError.message)
    return res.status(401).json({ error: 'Credenciales inválidas.' })
  }

  if (!authData.user) {
    return res.status(401).json({ error: 'No se pudo autenticar al usuario.' })
  }

  // ----> ESTA ES LA PARTE CORREGIDA <----
  // 2. Obtener el rol del usuario desde la tabla 'perfiles'
  const { data: profileData, error: profileError } = await supabase
    .from('perfiles')
    .select('rol') // Puedes ser específico y pedir solo el rol, o '*' para todo el perfil
    .eq('id', authData.user.id) // <-- FILTRO CLAVE: busca el perfil cuyo ID coincida con el del usuario en sesión
    .single() // <-- MEJORA: espera un único resultado y lo devuelve como objeto, no como array.

  // Para depurar, puedes poner los logs aquí:
  console.log('ID del usuario logueado:', authData.user.id)
  if (profileError) {
    console.error('Error al buscar el perfil:', profileError.message)
  }
  console.log('Datos del perfil obtenidos:', profileData)
  // ----> FIN DE LA CORRECCIÓN <----

  if (profileError || !profileData) {
    // Si hay un error o no se encuentra el perfil, devuelve un error claro.
    // 'profileError' se activará si `.single()` no encuentra exactamente una fila.
    return res.status(500).json({ error: 'No se pudo encontrar el perfil del usuario.' })
  }

  // 3. Devolver el rol para que el frontend pueda redirigir
  return res.status(200).json({ rol: profileData.rol })
}