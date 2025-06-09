// pages/api/auth/login.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
    }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return res.status(401).json({ error: "Usuario o contraseña invalido" })
  }

  const user = data.user
  const rol = user?.user_metadata?.rol || 'docente' // ajusta esto a tu lógica

  return res.status(200).json({ rol })
}
