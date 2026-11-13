export function nuevaClave() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));

  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;

  const s = Array.from(
    bytes,
    b => b.toString(16).padStart(2, "0")
  ).join("");

  return [
    s.slice(0, 8),
    s.slice(8, 12),
    s.slice(12, 16),
    s.slice(16, 20),
    s.slice(20),
  ].join("-");
}

export function mensajeError(error) {
  if (error.response?.status === 401) {
    return "Inicia sesión desde el menú para continuar.";
  }

  if (error.response?.status === 403) {
    return "Esta acción requiere permisos de administrador.";
  }

  const detalle = error.response?.data?.detail;

  if (typeof detalle === "string") {
    return detalle;
  }

  if (Array.isArray(detalle)) {
    return detalle.map(item => item.msg).join("; ");
  }

  return "No se pudo completar la solicitud. Revisa la conexión.";
}