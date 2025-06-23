// @components/dashboard/alumno/ChatIA.jsx

import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

/**
 * Un componente de chat que permite a los usuarios hacer preguntas sobre una clase específica.
 * Envía la pregunta a una Edge Function de Supabase que utiliza IA para generar una respuesta
 * basada en el contenido de la clase.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {number|string} props.claseId - El ID de la clase actual sobre la que se harán preguntas.
 * @returns {JSX.Element}
 */
export default function ChatIA({ claseId }) {
  const supabase = useSupabaseClient();
  
  const [pregunta, setPregunta] = useState('');
  const [historial, setHistorial] = useState([]); // Para guardar la conversación
  const [isLoading, setIsLoading] = useState(false);

  const handlePregunta = async (e) => {
    e.preventDefault();
    const preguntaActual = pregunta.trim();
    if (!preguntaActual) return;

    setIsLoading(true);
    // Añadimos la pregunta del usuario al historial inmediatamente para una UI más rápida
    setHistorial(prev => [...prev, { tipo: 'usuario', texto: preguntaActual }]);
    setPregunta('');

    try {
      // Llamamos a la Edge Function 'responder-pregunta'
      const { data, error } = await supabase.functions.invoke('responder-pregunta', {
        method: 'POST',
        body: { 
          claseId: claseId,
          pregunta: preguntaActual 
        },
      });

      if (error) {
        throw error;
      }
      
      // Añadimos la respuesta de la IA al historial
      setHistorial(prev => [...prev, { tipo: 'ia', texto: data.respuesta }]);

    } catch (error) {
      console.error("Error al obtener respuesta de la IA:", error);
      // Añadimos un mensaje de error al historial
      setHistorial(prev => [...prev, { tipo: 'ia', texto: 'Lo siento, ha ocurrido un error al procesar tu pregunta. Por favor, inténtalo de nuevo.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Pregúntale a la Clase</h3>
      
      {/* Historial de la Conversación */}
      <div className="mb-4 space-y-4 max-h-80 overflow-y-auto pr-2">
        {historial.map((item, index) => (
          <div key={index} className={`flex ${item.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-prose px-4 py-2 rounded-lg ${
              item.tipo === 'usuario' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}>
              <p className="whitespace-pre-wrap">{item.texto}</p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800">
                    <span className="animate-pulse">Pensando...</span>
                </div>
            </div>
        )}
      </div>

      {/* Formulario de Pregunta */}
      <form onSubmit={handlePregunta} className="flex items-center gap-3">
        <input
          type="text"
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          placeholder="Escribe tu pregunta sobre esta clase..."
          className="flex-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors" 
          disabled={isLoading || !pregunta.trim()}
        >
          Enviar
        </button>
      </form>
      <p className="text-xs text-gray-400 mt-2">La IA responderá basándose únicamente en el contenido de esta clase.</p>
    </div>
  );
}