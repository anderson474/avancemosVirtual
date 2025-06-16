import ClaseCard from '@components/dashboard/docente/claseCard'


export default function ListaClasesDocente({ clases }) {
  return (
    <div className="p-6 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-20">
      {clases.length === 0 ? (
        <p className="text-gray-500 col-span-full">No tienes clases asignadas aún.</p>
      ) : (
        clases.map((clase) => (
          <ClaseCard key={clase.id} clase={clase} />
        ))
      )}
    </div>
  )
}
