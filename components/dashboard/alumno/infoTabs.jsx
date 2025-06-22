// /components/dashboard/alumno/InfoTabs.jsx
import { useState } from 'react';

// Importa todos los componentes necesarios para las pestañas.
import ComentariosSection from '@components/dashboard/alumno/comentarioSection';
import RecursosSection from '@components/dashboard/alumno/recursosSection';
import NotasPersonales from '@components/dashboard/alumno/notasPersonales'; // <-- Asegúrate de importar tu nuevo componente

export default function InfoTabs({ claseId }) {
  // Cambiamos el estado inicial a 'notas' para que sea la primera pestaña visible,
  // pero puedes dejarlo en 'comentarios' si lo prefieres.
  const [activeTab, setActiveTab] = useState('notas');

  return (
    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
      {/* Pestañas de Navegación */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          
          {/* BOTÓN PARA LA NUEVA PESTAÑA "MIS NOTAS" */}
          <button
            onClick={() => setActiveTab('notas')}
            className={`${
              activeTab === 'notas'
                ? 'border-blue-500 text-blue-600' // Color primario para la pestaña activa
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
          >
            Mis Notas
          </button>
          
          {/* BOTÓN PARA LA PESTAÑA "COMENTARIOS" */}
          <button
            onClick={() => setActiveTab('comentarios')}
            className={`${
              activeTab === 'comentarios'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
          >
            Comentarios
          </button>

          {/* BOTÓN PARA LA PESTAÑA "RECURSOS" */}
          <button
            onClick={() => setActiveTab('recursos')}
            className={`${
              activeTab === 'recursos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
          >
            Recursos
          </button>

        </nav>
      </div>

      {/* Contenido de la Pestaña Activa */}
      <div className="mt-6">
        {/* LÓGICA PARA MOSTRAR EL COMPONENTE ACTIVO */}
        {activeTab === 'notas' && <NotasPersonales claseId={claseId} />}
        {activeTab === 'comentarios' && <ComentariosSection claseId={claseId} />}
        {activeTab === 'recursos' && <RecursosSection claseId={claseId} />}
      </div>
    </div>
  );
}