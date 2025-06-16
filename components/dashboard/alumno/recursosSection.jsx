// /components/dashboard/alumno/RecursosSection.jsx
import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

export default function RecursosSection({ claseId }) {
    const supabase = useSupabaseClient();
    const [recursos, setRecursos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecursos = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('recursos')
                .select('*')
                .eq('clase_id', claseId);
            
            if (error) console.error("Error fetching recursos", error);
            else setRecursos(data);
            setLoading(false);
        };
        if (claseId) fetchRecursos();
    }, [claseId, supabase]);

    return (
        <div className="space-y-3">
            {loading ? <p>Cargando recursos...</p> :
                recursos.length > 0 ? recursos.map(r => (
                    <a
                        key={r.id}
                        href={r.url_recurso}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-4 bg-blue-50 text-blue-800 rounded-lg hover:bg-blue-100 transition"
                    >
                        <DocumentArrowDownIcon className="h-6 w-6 mr-3" />
                        <span className="font-medium">{r.titulo}</span>
                    </a>
                )) : <p>No hay recursos para esta clase.</p>
            }
        </div>
    );
}