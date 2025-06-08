import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '../../../utils/supabase/client'

// Reemplaza con tu URL y clave de Supabase


export default function CrearRuta() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userId, setUserId] = useState(null)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const supabase = createClient(document.cookie)

  useEffect(() => {
    const fetchUserData = async () => {
      console.log('🔄 Iniciando fetchUserData...')
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        console.log('📥 Usuario obtenido:', user)
        if (userError) {
          console.error('❌ Error al obtener el usuario:', userError)
          throw userError
        }

        if (!user) {
          console.warn('⚠️ Usuario no autenticado. Redirigiendo...')
          router.push('/')
          return
        }

        setUserId(user.id)
        console.log('✅ Usuario autenticado con ID:', user.id)
        setLoading(false)
      } catch (err) {
        console.error('❗ Error en fetchUserData:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('🚀 Enviando formulario...')

    try {
      console.log('📤 Insertando en rutas:', { titulo, descripcion, creada_por: userId })

      const { error: insertError } = await supabase
        .from('Rutas')
        .insert([{ titulo, descripcion, creada_por: userId }])

        if (insertError) {
          console.error('❌ Error al insertar en rutas:', insertError)
          console.error('📄 Mensaje del error:', insertError.message)
          console.error('📄 Detalles:', insertError.details)
          throw insertError
        }

      console.log('✅ Ruta creada con éxito')
      alert('Ruta creada con éxito')
      setTitulo('')
      setDescripcion('')
    } catch (err) {
      console.error('❗ Error en handleSubmit:', err)
      setError(err.message)
    }
  }

  if (loading) return <div>Cargando...</div>
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>

  return (
    <div style={{ backgroundColor: 'white', padding: '2rem', maxWidth: '600px', margin: '2rem auto', borderRadius: '8px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
      <h2 className='text-black'>Crear nueva ruta</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label className='text-black'>Título:</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            className='bg-gray-100 text-black'
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className='text-black'>Descripción:</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
            className='bg-gray-100 text-black'
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <button type="submit" style={{ padding: '0.5rem 1rem' }} className='bg-blue-300'>
          Crear ruta
        </button>
      </form>
    </div>
  )
}
