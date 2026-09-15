import Image from "next/image";

export default function Inicio() {
  return (
    <div className="carousel w-full">
      
      
      <div id="slide1" className="carousel-item relative w-full h-125">
        
        <Image
          alt="Proyecto Solar 1"
          src="/imagenTrabajador1.png" 
          fill
          className="object-cover" 
        />
        <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
          <a href="#slide4" className="btn btn-circle bg-white/50 border-none text-black hover:bg-white">❮</a>
          <a href="#slide2" className="btn btn-circle bg-white/50 border-none text-black hover:bg-white">❯</a>
        </div>
      </div>

     
   



    </div>
  );
}