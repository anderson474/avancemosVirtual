import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '../../../utils/supabase/client'
import Slidebar from '@components/dashboard/alumno/slidebar'
import Bienvenida from '@components/dashboard/alumnos/bienvenida'

export default function AlumnoPage() {
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClient(document.cookie)

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/')
        }

        const { data: perfil } = await supabase
          .from('perfiles')
          .select('rol, name')
          .eq('id', user.id)
          .single()

        if (perfil?.rol !== 'alumno') {
          router.push('/')
        }
        setNombre(perfil.name);
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  if (loading) return <div>Cargando...</div>
  if (error) return <div>Error: {error}</div>

  return(
    <>
        <Slidebar />
        <main className="p-6">
        <Bienvenida nombre={nombre} />
        {/* Aquí puedes agregar más contenido del alumno */}
      </main>
    </>
    
  );
}