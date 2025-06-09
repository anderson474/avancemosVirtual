export default function ClaseCard({ clase }) {
  return (
    <div className="bg-white h-1/2 mt-10 shadow-md rounded-lg p-4 border border-gray-200 hover:shadow-lg transition cursor-pointer">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{clase.titulo}</h3>
      <p className="text-sm text-gray-600 mb-2">{clase.descripcion}</p>
      <p className="text-sm text-gray-500">
        <span className="font-semibold">Ruta:</span> {clase.rutaAsignada}
      </p>
      <a
        href={clase.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline text-sm block mt-2"
      >
        Ver video
      </a>
    </div>
  )
}
