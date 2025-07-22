// /components/dashboard/alumno/RecursosSection.jsx
import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { InformationCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

// Un componente de esqueleto para una mejor experiencia de carga
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 w-1/2 bg-slate-200 rounded"></div>
    <div className="space-y-2">
      <div className="h-4 bg-slate-200 rounded"></div>
      <div className="h-4 w-5/6 bg-slate-200 rounded"></div>
      <div className="h-4 w-4/6 bg-slate-200 rounded"></div>
    </div>
  </div>
);

export default function RecursosSection({ claseId }) {
    const supabase = useSupabaseClient();
    // Ahora esperamos un único objeto de recurso, o null
    const [recurso, setRecurso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!claseId) {
            setLoading(false);
            return;
        }

        const fetchRecurso = async () => {
            setLoading(true);
            setError(null);

            // Buscamos un único recurso para la clase
            const { data, error } = await supabase
                .from('recursos')
                .select('titulo, contenido')
                .eq('clase_id', claseId)
                .maybeSingle(); // .maybeSingle() es perfecto: devuelve un objeto, o null si no encuentra nada.

            if (error) {
                console.error("Error fetching recurso", error);
                setError("No se pudieron cargar los recursos.");
            } else {
                setRecurso(data);
            }
            setLoading(false);
        };

        fetchRecurso();
    }, [claseId, supabase]);

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (error) {
        return (
            <div className="flex items-center p-4 bg-red-50 text-red-700 rounded-lg">
                <InformationCircleIcon className="h-6 w-6 mr-3" />
                <p>{error}</p>
            </div>
        );
    }

    if (!recurso) {
        return (
            <div className="flex items-center p-4 bg-slate-100 text-slate-600 rounded-lg">
                <InformationCircleIcon className="h-6 w-6 mr-3" />
                <p>No hay recursos o contenido adicional para esta clase.</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center mb-4">
                <DocumentTextIcon className="h-6 w-6 mr-3 text-indigo-600" />
                <h3 className="text-xl font-bold text-slate-800">{recurso.titulo}</h3>
            </div>
            {/* 
              Aquí renderizamos el contenido HTML.
              Añadimos la clase 'prose' para darle un estilo de lectura agradable.
            */}
            <div
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: recurso.contenido }}
            />
        </div>
    );
}