// /components/dashboard/alumno/ComentariosSection.jsx
import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export default function ComentariosSection({ claseId }) {
    const supabase = useSupabaseClient();
    const user = useUser();
    const [comentarios, setComentarios] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComentarios = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('comentarios')
                .select(`*, autor:perfiles(nombre, id)`) // JOIN con perfiles para obtener el nombre
                .eq('clase_id', claseId)
                .order('created_at', { ascending: false });

            if (error) console.error("Error fetching comentarios", error);
            else setComentarios(data);
            setLoading(false);
        };

        if (claseId) fetchComentarios();
    }, [claseId, supabase]);

    const handlePostComentario = async (e) => {
        e.preventDefault();
        if (!nuevoComentario.trim()) return;

        const { data, error } = await supabase
            .from('comentarios')
            .insert({ contenido: nuevoComentario, autor_id: user.id, clase_id: claseId })
            .select(`*, autor:perfiles(nombre, id)`)
            .single();
        
        if (error) {
            alert('Error al publicar el comentario.');
            console.error(error);
        } else {
            setComentarios([data, ...comentarios]);
            setNuevoComentario('');
        }
    };

    return (
        <div>
            <form onSubmit={handlePostComentario} className="mb-6">
                <textarea
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Escribe tu comentario o pregunta..."
                    rows="3"
                ></textarea>
                <button type="submit" className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Publicar
                </button>
            </form>
            <div className="space-y-4">
                {loading ? <p>Cargando comentarios...</p> : 
                    comentarios.length > 0 ? comentarios.map(c => (
                        <div key={c.id} className="p-4 bg-gray-50 rounded-lg">
                            <p className="font-bold text-gray-800">{c.autor?.nombre || 'Usuario'}</p>
                            <p className="text-sm text-gray-500 mb-2">{new Date(c.created_at).toLocaleString()}</p>
                            <p className="text-gray-700">{c.contenido}</p>
                        </div>
                    )) : <p>Sé el primero en comentar.</p>
                }
            </div>
        </div>
    );
}