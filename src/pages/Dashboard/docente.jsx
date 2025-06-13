// src/pages/Dashboard/docente.jsx
import { useState } from 'react';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

// Tus imports de componentes siguen igual...
import Slidebar from '@components/dashboard/docente/slidebar';
import Bienvenida from '@components/dashboard/bienvenida';
import CrearRutaDrawer from '@components/dashboard/docente/crearRutaDrawer';
import SubirClaseDrawer from '@components/dashboard/docente/subirClaseDrawer';
import EliminarClaseDrawer from '@components/dashboard/docente/eliminarClaseDrawer';
import EliminarRutaDrawer from '@components/dashboard/docente/eliminarRutas';
import ListaClasesDocente from '@components/dashboard/docente/listaClaseDocente';

export default function DocentePage({ user, initialRutas, initialClases }) {
  const [vista, setVista] = useState(null);
  const [rutas, setRutas] = useState(initialRutas);
  const [clases, setClases] = useState(initialClases);

  const handleOpcion = (opcion) => setVista(opcion);
  const cerrarDrawer = () => setVista(null);

  // --- FUNCIONES PARA ACTUALIZAR EL ESTADO ---
  const agregarRuta = (nuevaRuta) => {
    setRutas([...rutas, nuevaRuta]);
  };
  const removerRuta = (idRuta) => {
    setRutas(rutas.filter(r => r.id !== idRuta));
  };
  const agregarClase = (nuevaClase) => {
    setClases([...clases, nuevaClase]);
  };
  const removerClase = (idClase) => {
    setClases(clases.filter(c => c.id !== idClase));
  };

  return (
    <div className="flex">
      <Slidebar onSelect={handleOpcion} />
      <main className="flex-1">
        <Bienvenida nombre={user.nombre || user.email} />
        <ListaClasesDocente clases={clases} rutas={rutas} />
      </main>

      {/* Pasamos los datos y las funciones de actualización a los drawers */}
      <CrearRutaDrawer
        visible={vista === 'crearRuta'}
        onClose={cerrarDrawer}
        onRutaCreada={agregarRuta}
      />
      <SubirClaseDrawer
        visible={vista === 'subirClase'}
        onClose={cerrarDrawer}
        rutasDisponibles={rutas}
        onClaseCreada={agregarClase}
      />
      <EliminarRutaDrawer
        visible={vista === 'eliminarRuta'}
        onClose={cerrarDrawer}
        rutas={rutas}
        onRutaEliminada={removerRuta}
      />
      <EliminarClaseDrawer
        visible={vista === 'eliminarClase'}
        onClose={cerrarDrawer}
        clases={clases}
        onClaseEliminada={removerClase}
      />
    </div>
  );
}

// --- CARGA DE DATOS DEL LADO DEL SERVIDOR ---
export async function getServerSideProps(ctx) {
  const supabase = createPagesServerClient(ctx);
  
  const { data: { session } } = await supabase.auth.getSession();


  // ----> AÑADE ESTE LOG <----
  console.log('SESSION EN EL SERVIDOR (getServerSideProps):', session ? `Usuario ${session.user.email}` : 'SESIÓN NULA');

  
  if (!session) {
    return { redirect: { destination: '/avancemosDigital', permanent: false } };
  }

  

  // Obtener perfil del docente
  const { data: userProfile } = await supabase
    .from('perfiles')
    .select('nombre')
    .eq('id', session.user.id)
    .single();

  // Obtener las rutas creadas por este docente
  const { data: rutas } = await supabase
    .from('rutas')
    .select('*')
    .eq('docente_id', session.user.id);
    
  // Obtener las clases que pertenecen a las rutas de este docente
  const rutaIds = rutas?.map(r => r.id) || [];
  const { data: clases } = rutaIds.length > 0 
    ? await supabase.from('clases').select('*, rutas(nombre)').in('ruta_id', rutaIds) 
    : { data: [] };

  return {
    props: {
      user: userProfile,
      initialRutas: rutas || [],
      initialClases: clases || [],
    },
  };
}

