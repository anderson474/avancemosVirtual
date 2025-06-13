// src/components/dashboard/docente/CrearRutaDrawer.jsx

import { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

// 1. ACEPTAMOS LA PROP 'onRutaCreada'
export default function CrearRutaDrawer({ visible, onClose, onRutaCreada }) {
  // --- ESTADOS DEL FORMULARIO ---
  const [nombre, setNombre] = useState('');
  const [nivel, setNivel] = useState('Nivel Básico');
  const [idioma, setIdioma] = useState('');
  const [descripcion, setDescripcion] = useState('');

  
  // --- ESTADOS PARA LA EXPERIENCIA DE USUARIO (UX) ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const supabase = useSupabaseClient();
  const user = useUser();

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // Inicia el estado de carga
    setFeedback({ type: '', message: '' }); // Resetea mensajes anteriores

    
    if (!user) {
      setIsSubmitting(false);
      setFeedback({ type: 'error', message: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.' });
      return;
    }

    const { data: nuevaRuta, error } = await supabase
      .from('rutas')
      .insert({
        nombre,
        nivel,
        idioma,
        descripcion,
        docente_id: user.id,
      })
      .select()
      .single();

    if (error) {
      // Si hay un error, lo mostramos en la UI
      setIsSubmitting(false);
      setFeedback({ type: 'error', message: 'Error al crear la ruta: ' + error.message });
    } else {
      // Si todo sale bien, mostramos un mensaje de éxito
      setFeedback({ type: 'success', message: '¡Ruta creada con éxito!' });
      onRutaCreada(nuevaRuta); // Llamamos a la función del padre para actualizar la lista de rutas

      // Limpiamos el formulario
      setNombre('');
      setNivel('Nivel Básico');
      setIdioma('');
      setDescripcion('');
      
      // Cerramos el drawer después de un momento para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        onClose();
        setIsSubmitting(false);
        setFeedback({ type: '', message: '' }); // Limpia el feedback para la próxima vez que se abra
      }, 2000); // 2 segundos
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
        visible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold">Crear nueva ruta</h2>
        <button onClick={onClose} className='p-1 rounded-full hover:text-red-600 hover:bg-red-100'>
          <IoClose size={24} />
        </button>
      </div>

      {/* 2. EL BOTÓN 'submit' AHORA SOLO ESTÁ EN EL FORMULARIO */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* ... (tus inputs de nombre, nivel, idioma, descripción no cambian) ... */}
        <div>
          <label className="block font-medium">Nombre de la ruta</label>
          <input type="text" className="w-full border border-gray-300 p-2 rounded" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div>
          <label className="block font-medium">Nivel</label>
          <select className="w-full border border-gray-300 p-2 rounded cursor-pointer" value={nivel} onChange={(e) => setNivel(e.target.value)}>
            <option>Nivel Básico</option>
            <option>Nivel Intermedio</option>
            <option>Nivel Avanzado</option>
          </select>
        </div>
        <div>
          <label className="block font-medium">Idioma</label>
          <input type="text" className="w-full border border-gray-300 p-2 rounded" value={idioma} onChange={(e) => setIdioma(e.target.value)} required />
        </div>
        <div>
          <label className="block font-medium">Descripción</label>
          <textarea className="w-full border border-gray-300 p-2 rounded" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)}></textarea>
        </div>

        {/* 3. MENSAJE DE FEEDBACK VISUAL */}
        {feedback.message && (
          <div className={`p-3 rounded-md text-sm text-center ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {feedback.message}
          </div>
        )}

        {/* 4. BOTÓN CON ESTADO DE CARGA */}
        <button
          type="submit"
          disabled={isSubmitting} // Se deshabilita mientras se envía
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Creando...' : 'Crear Ruta'}
        </button>
      </form>
    </div>
  );
}