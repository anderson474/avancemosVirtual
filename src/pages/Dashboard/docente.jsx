import { useState } from 'react'
import Slidebar from '@components/dashboard/docente/slidebar'
import Bienvenida from '@components/dashboard/bienvenida'
import CrearRutaDrawer from '@components/dashboard/docente/crearRutaDrawer'
import SubirClaseDrawer from '@components/dashboard/docente/subirClaseDrawer'
import EliminarClaseDrawer from '@components/dashboard/docente/eliminarClaseDrawer'
import EliminarRutaDrawer from '@components/dashboard/docente/eliminarRutas'
import ListaClasesDocente from '@components/dashboard/docente/listaClaseDocente'

export default function DocentePage() {
  const [vista, setVista] = useState(null)

  const handleOpcion = (opcion) => setVista(opcion)
  const cerrarDrawer = () => setVista(null)

  const clasesMock = [
    {
      id: 1,
      titulo: 'Saludos en inglés',
      descripcion: 'Aprenderás a saludar formal e informalmente.',
      rutaAsignada: 'Inglés A1',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    {
      id: 2,
      titulo: 'Verbos básicos',
      descripcion: 'Uso de verbos comunes en presente simple.',
      rutaAsignada: 'Inglés A1',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
  ]

  return (
    <div className="flex">
      <Slidebar onSelect={handleOpcion} />
      <Bienvenida nombre="Anderson" />
      <ListaClasesDocente clases={clasesMock} />
      <CrearRutaDrawer visible={vista === 'crearRuta'} onClose={cerrarDrawer} />
      <SubirClaseDrawer visible={vista === 'subirClase'} onClose={cerrarDrawer} />
      <EliminarRutaDrawer visible={vista === 'eliminarRuta'} onClose={cerrarDrawer} />
      <EliminarClaseDrawer visible={vista === 'eliminarClase'} onClose={cerrarDrawer} />
    </div>
  )
}


