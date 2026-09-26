import Image from "next/image";

export default function ProductCard({ producto }) {
  return (
    <div className="card bg-white shadow-xl border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full">
      <figure className="relative h-32 md:h-56 w-full bg-white rounded-t-2xl shrink-0">
        <Image 
          src={producto.imagen} 
          alt={producto.nombre} 
          fill 
          className="object-contain p-2 md:p-4"
        />
      </figure>
      <div className="card-body p-4 md:p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="card-title text-sm md:text-lg text-[#0F2547] leading-tight mb-2 line-clamp-2">{producto.nombre}</h3>
          <div className="badge badge-sm md:badge-md bg-[#00fc82] text-[#0F2547] border-none font-semibold mb-2">{producto.categoria}</div>
          <p className="text-xl md:text-3xl font-bold text-gray-800 my-1 md:my-2">{producto.precio}</p>
        </div>
        <div className="card-actions mt-2 md:mt-4 w-full">
          <button className="btn btn-sm md:btn-md bg-[#0F2547] text-white hover:bg-[#00fc82] hover:text-[#0F2547] border-none w-full shadow-md font-bold text-xs md:text-lg transition-colors">
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}

