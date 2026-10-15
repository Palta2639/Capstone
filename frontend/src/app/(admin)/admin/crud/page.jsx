"use client";

import { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiPlus, FiSearch } from "react-icons/fi";
import { productService } from "@/src/services/api";
import { formatearMoneda } from "@/src/utils/formatters";
import { sanitizeText, sanitizeSearch } from "@/src/utils/validations";

export default function CrudProductos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null); // { text: "", type: "success" | "error" }

  // Estado del formulario alineado con backend/schemas.py -> ProductoCreate
  const [formData, setFormData] = useState({ 
    id: null, 
    nombre: "", 
    descripcion: "", 
    precio: "", 
    stock: 0, 
    potencia_watts: "", 
    categoria_id: "", 
    imagen_url: "", 
    es_kit: false 
  });

  // Mostrar mensaje temporal
  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const recargarProductos = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProductos(data);
    } catch (error) {
      console.error("Error cargando productos:", error);
      showToast("Error al conectar con la base de datos.", "error");
    } finally {
      setLoading(false);
    }
  };

  // CARGAR PRODUCTOS DESDE LA BASE DE DATOS
  useEffect(() => {
    let cancel = false;
    productService.getAll()
      .then((data) => {
        if (!cancel) setProductos(data);
      })
      .catch((error) => {
        console.error("Error cargando productos:", error);
        showToast("Error al conectar con la base de datos.", "error");
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  const handleSearch = (e) => {
    const sanitized = sanitizeSearch(e.target.value);
    setSearchTerm(sanitized);
  };

  const openModal = (producto = null) => {
    if (producto) {
      setFormData(producto);
    } else {
      setFormData({ 
        id: null, 
        nombre: "", 
        descripcion: "", 
        precio: "", 
        stock: 0, 
        potencia_watts: "", 
        categoria_id: "", 
        imagen_url: "", 
        es_kit: false 
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (!formData.nombre || !formData.nombre.trim()) {
        showToast("El nombre del producto es obligatorio.", "error");
        return;
      }
      if (!formData.categoria_id) {
        showToast("Selecciona una categoría válida.", "error");
        return;
      }
      if (formData.precio === "" || isNaN(formData.precio) || Number(formData.precio) < 0) {
        showToast("Ingresa un precio válido mayor o igual a 0.", "error");
        return;
      }

      // Preparamos la data sanitizada contra XSS e inyecciones
      const payload = {
        nombre: sanitizeText(formData.nombre, 100),
        descripcion: formData.descripcion ? sanitizeText(formData.descripcion, 500) : null,
        precio: Math.max(0, Number(formData.precio) || 0),
        stock: Math.max(0, Number(formData.stock) || 0),
        potencia_watts: formData.potencia_watts ? Math.max(0, Number(formData.potencia_watts)) : null,
        categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
        imagen_url: formData.imagen_url ? sanitizeText(formData.imagen_url, 255) : null,
        es_kit: Boolean(formData.es_kit)
      };

      if (formData.id) {
        // Editar en API
        await productService.update(formData.id, payload);
        showToast("Producto actualizado correctamente.");
      } else {
        // Crear en API
        await productService.create(payload);
        showToast("Producto creado exitosamente.");
      }
      // Recargar la lista real de la base de datos
      recargarProductos();
      closeModal();
    } catch (error) {
      console.error("Error guardando producto:", error);
      showToast("Error al guardar en la base de datos.", "error");
    }
  };

  const [productToDelete, setProductToDelete] = useState(null);

  const handleDelete = (id) => {
    setProductToDelete(id);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await productService.delete(productToDelete);
      setProductos(productos.filter(p => p.id !== productToDelete));
      showToast("Producto eliminado correctamente.");
    } catch (error) {
      console.error("Error eliminando producto:", error);
      showToast("No se pudo eliminar el producto.", "error");
    } finally {
      setProductToDelete(null);
    }
  };

  const filteredProductos = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0F2547]">Gestión de Productos</h1>
          <p className="text-gray-500 mt-1">Sincronizado con la Base de Datos</p>
        </div>
        
        <button 
          onClick={() => openModal()}
          className="btn bg-[#00fc82] text-[#0F2547] hover:bg-[#00fc82]/80 border-none font-bold shadow-lg shadow-[#00fc82]/20 rounded-xl"
        >
          <FiPlus className="mr-2" /> Nuevo Producto
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
        {/* Barra de herramientas */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="relative w-full max-w-md">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar productos..." 
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 text-gray-900 placeholder:text-gray-400 rounded-xl border-none focus:ring-2 focus:ring-[#00fc82] text-sm font-medium outline-none transition-all"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-gray-50 text-gray-500 font-bold text-sm">
              <tr>
                <th className="py-4 px-6 rounded-tl-3xl">Nombre</th>
                <th>Cat. ID</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Watts</th>
                <th>Tipo</th>
                <th className="text-right rounded-tr-3xl px-6">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-500 font-medium">
                    Cargando productos desde la base de datos...
                  </td>
                </tr>
              ) : filteredProductos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400">
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                filteredProductos.map((producto) => (
                  <tr key={producto.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-none">
                    <td className="py-4 px-6 font-semibold text-gray-800">{producto.nombre}</td>
                    <td className="text-gray-600 font-medium">#{producto.categoria_id}</td>
                    <td className="text-gray-800 font-medium">{formatearMoneda(producto.precio)}</td>
                    <td>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${producto.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {producto.stock > 0 ? `${producto.stock} uds.` : "Agotado"}
                      </span>
                    </td>
                    <td className="text-gray-600 font-medium">{producto.potencia_watts ? `${producto.potencia_watts}W` : "-"}</td>
                    <td>
                      {producto.es_kit ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">KIT</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold">Unidad</span>
                      )}
                    </td>
                    <td className="px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openModal(producto)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(producto.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-8 z-50 w-[95%] max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-extrabold text-[#0F2547] mb-6">
              {formData.id ? "Editar Producto" : "Nuevo Producto"}
            </h2>
            
            <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-control md:col-span-2">
                  <label className="label py-1"><span className="label-text font-bold text-gray-600">Nombre del Producto</span></label>
                  <input 
                    type="text" 
                    value={formData.nombre}
                    maxLength={100}
                    onChange={(e) => setFormData({...formData, nombre: sanitizeText(e.target.value, 100)})}
                    className="input bg-gray-50 text-black border-gray-200 focus:border-[#00fc82] focus:ring-[#00fc82] w-full" 
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text font-bold text-gray-600">Categoría</span></label>
                  <select 
                    value={formData.categoria_id || ""}
                    onChange={(e) => setFormData({...formData, categoria_id: Number(e.target.value)})}
                    className="select bg-gray-50 text-black border-gray-200 focus:border-[#00fc82] focus:ring-[#00fc82] w-full"
                    required
                  >
                    <option value="" disabled>Seleccionar</option>
                    <option value={1}>1 - Paneles</option>
                    <option value={2}>2 - Inversores</option>
                    <option value={3}>3 - Baterías</option>
                    <option value={4}>4 - Kits Solares</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text font-bold text-gray-600">Precio ($)</span></label>
                  <input 
                    type="number" 
                    min="0"
                    max="100000000"
                    value={formData.precio}
                    onChange={(e) => setFormData({...formData, precio: Math.max(0, Number(e.target.value))})}
                    className="input bg-gray-50 text-black border-gray-200 focus:border-[#00fc82] focus:ring-[#00fc82] w-full" 
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text font-bold text-gray-600">Stock</span></label>
                  <input 
                    type="number" 
                    min="0"
                    max="100000"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: Math.max(0, Number(e.target.value))})}
                    className="input bg-gray-50 text-black border-gray-200 focus:border-[#00fc82] focus:ring-[#00fc82] w-full" 
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text font-bold text-gray-600">Potencia (W)</span></label>
                  <input 
                    type="number" 
                    min="0"
                    max="100000"
                    value={formData.potencia_watts || ""}
                    onChange={(e) => setFormData({...formData, potencia_watts: Math.max(0, Number(e.target.value))})}
                    placeholder="Ej. 500"
                    className="input bg-gray-50 text-black border-gray-200 focus:border-[#00fc82] focus:ring-[#00fc82] w-full" 
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1 opacity-0 pointer-events-none"><span className="label-text">Espacio</span></label>
                  <label className="cursor-pointer flex items-center justify-center gap-3 h-12 bg-gray-50 border border-gray-200 rounded-lg hover:border-[#00fc82] transition-colors">
                    <input 
                      type="checkbox" 
                      checked={formData.es_kit}
                      onChange={(e) => setFormData({...formData, es_kit: e.target.checked})}
                      className="checkbox checkbox-success border-gray-300" 
                    />
                    <span className="label-text font-bold text-gray-600">¿Es un Kit?</span>
                  </label>
                </div>
              </div>

              <div className="form-control">
                <label className="label py-1"><span className="label-text font-bold text-gray-600">URL Imagen (Opcional)</span></label>
                <input 
                  type="text" 
                  maxLength={255}
                  value={formData.imagen_url || ""}
                  onChange={(e) => setFormData({...formData, imagen_url: sanitizeText(e.target.value, 255)})}
                  placeholder="/panel-solar.png"
                  className="input bg-gray-50 text-black border-gray-200 focus:border-[#00fc82] focus:ring-[#00fc82] w-full" 
                />
              </div>

              <div className="form-control mb-2">
                <label className="label py-1"><span className="label-text font-bold text-gray-600">Descripción (Opcional)</span></label>
                <textarea 
                  maxLength={500}
                  value={formData.descripcion || ""}
                  onChange={(e) => setFormData({...formData, descripcion: sanitizeText(e.target.value, 500)})}
                  placeholder="Detalles técnicos del producto..."
                  className="textarea bg-gray-50 text-black border-gray-200 focus:border-[#00fc82] focus:ring-[#00fc82] w-full h-24 resize-none leading-relaxed" 
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end mt-4 border-t border-gray-100 pt-4">
                <button type="button" onClick={closeModal} className="btn btn-ghost text-gray-500 hover:bg-gray-100">
                  Cancelar
                </button>
                <button type="submit" className="btn bg-[#0F2547] text-white hover:bg-[#00fc82] hover:text-[#0F2547] border-none font-bold">
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {productToDelete && (
        <>
          <div className="fixed inset-0 bg-black/60 z-60 backdrop-blur-sm transition-opacity" onClick={() => setProductToDelete(null)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-8 z-70 w-[90%] max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTrash2 className="text-red-500 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-[#0F2547] mb-2">¿Eliminar producto?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Esta acción es permanente y eliminará el producto de la base de datos.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setProductToDelete(null)} 
                className="btn btn-ghost text-gray-500 hover:bg-gray-100 flex-1"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete} 
                className="btn bg-red-500 text-white hover:bg-red-600 border-none font-bold flex-1 shadow-lg shadow-red-500/30"
              >
                Eliminar
              </button>
            </div>
          </div>
        </>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast toast-bottom toast-center z-100">
          <div className={`alert ${toastMessage.type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg rounded-xl text-white font-bold`}>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}

