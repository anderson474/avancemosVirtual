// @components/dashboard/alumno/ChatIA.jsx

import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import Lottie from 'lottie-react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

// TODO: Coloca tus animaciones Lottie en la carpeta public/animations/
import aiBrainAnimation from '@public/animation/ai-brain-animation.json';
import typingAnimation from '@public/animation/typing-dots-animation.json';

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
    // 1. Contenedor con la sombra multicolor
    <div className="relative group mt-8">
      {/* El elemento que crea la sombra con degradado y desenfoque */}
      <div 
        className="
          absolute -inset-1 
          bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 
          rounded-2xl 
          blur 
          opacity-25 
          group-hover:opacity-50 
          transition duration-1000 group-hover:duration-200
        "
        aria-hidden="true"
      ></div>

      {/* El contenido principal, por encima de la sombra */}
      <div className="relative p-6 bg-white rounded-2xl shadow-lg border border-slate-200">
        
        {/* 2. Título con el Lottie File */}
        <div className="flex items-center gap-3 mb-6">
          <Lottie 
            animationData={aiBrainAnimation} 
            loop={true} 
            className="w-14 h-14" 
          />
          <h3 className="text-2xl font-bold text-slate-800">Pregúntale a la IA</h3>
        </div>
        
        {/* 3. Historial de la Conversación con colores vibrantes */}
        <div className="mb-4 space-y-4 max-h-80 overflow-y-auto pr-4">
          {historial.map((item, index) => (
            <div key={index} className={`flex ${item.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-prose px-4 py-3 rounded-xl shadow-sm ${
                item.tipo === 'usuario' 
                  ? 'bg-gradient-to-br from-blue-500 to-violet-600 text-white rounded-br-none' 
                  : 'bg-slate-100 text-slate-800 rounded-bl-none'
              }`}>
                <p className="whitespace-pre-wrap text-sm">{item.texto}</p>
              </div>
            </div>
          ))}

          {/* 4. Indicador de carga mejorado con Lottie */}
          {isLoading && (
              <div className="flex justify-start">
                  <div className="px-4 py-2 rounded-xl rounded-bl-none bg-slate-100 flex items-center">
                      <Lottie animationData={typingAnimation} loop={true} className="w-16 h-8" />
                  </div>
              </div>
          )}
        </div>

        {/* 5. Formulario de Pregunta rediseñado */}
        <form onSubmit={handlePregunta} className="flex items-center gap-3">
          <input
            type="text"
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            placeholder="Escribe tu pregunta sobre esta clase..."
            className="flex-1 w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="
              flex items-center justify-center gap-2 px-5 py-3 
              font-semibold text-white rounded-lg 
              bg-gradient-to-r from-blue-600 to-violet-600 
              hover:opacity-90 active:scale-95 transition-all
              disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed
            "
            disabled={isLoading || !pregunta.trim()}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
            <span>Enviar</span>
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-2">La IA responderá basándose únicamente en el contenido de esta clase.</p>
      </div>
    </div>
  );
}
