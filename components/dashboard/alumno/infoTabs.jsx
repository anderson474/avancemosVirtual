// /components/dashboard/alumno/InfoTabs.jsx
import { useState } from 'react';

// --- CORRECCIÓN APLICADA ---
// Usamos los alias de ruta para mayor claridad y mantenibilidad.
import ComentariosSection from '@components/dashboard/alumno/comentarioSection';
import RecursosSection from '@components/dashboard/alumno/recursosSection';

export default function InfoTabs({ claseId }) {
  const [activeTab, setActiveTab] = useState('comentarios');

  return (
    <div className="mt-8">
      {/* Pestañas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('comentarios')}
            className={`${
              activeTab === 'comentarios'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Comentarios
          </button>
          <button
            onClick={() => setActiveTab('recursos')}
            className={`${
              activeTab === 'recursos'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Recursos
          </button>
        </nav>
      </div>

      {/* Contenido de la Pestaña */}
      <div className="mt-6">
        {activeTab === 'comentarios' && <ComentariosSection claseId={claseId} />}
        {activeTab === 'recursos' && <RecursosSection claseId={claseId} />}
      </div>
    </div>
  );
}