// Validadores de formato de texto (Anti-XSS y SQLi por Lista Blanca)
export const sanitizePhone = (value) => {
  if (!value) return "";
  return value.replace(/[^\d\s\-\+]/g, '').slice(0, 16);
};

export const sanitizeName = (value) => {
  if (!value) return "";
  return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '').slice(0, 60);
};

export const sanitizeEmail = (value) => {
  if (!value) return "";
  return value.replace(/[^A-Za-z0-9._\-+@]/g, '').slice(0, 80);
};

export const sanitizeSearch = (value) => {
  if (!value) return "";
  return value.replace(/[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü\s.\-]/g, '').slice(0, 80);
};

export const sanitizePassword = (value) => {
  if (!value) return "";
  return value.replace(/[^A-Za-z0-9!@#$%^&*()_+\-=\[\]{};:.,/?\s]/g, '').slice(0, 128);
};

export const sanitizeComuna = (value) => {
  if (!value) return "";
  return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s\-']/g, '').slice(0, 60);
};

// Sanitizador general para texto libre (descripciones, notas): elimina tags HTML y caracteres de escape
export const sanitizeText = (value, maxLength = 500) => {
  if (!value) return "";
  return value
    .replace(/<[^>]*>?/gm, '')
    .replace(/[<>'";`\\]/g, '')
    .slice(0, maxLength);
};

// Validador de reglas de negocio para AuthModal
export const validateAuthField = (name, value, isLogin = false) => {
  let error = "";
  
  if (name === "nombre" && !isLogin) {
    if (!value) error = "El nombre es obligatorio";
    else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]{3,60}$/.test(value)) error = "Solo letras y espacios (Mín. 3 caracteres)";
  }
  
  if (name === "email") {
    if (!value) error = "El correo es obligatorio";
    else if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(value)) error = "Formato de correo electrónico inválido";
  }
  
  if (name === "telefono" && value && !isLogin) {
    if (!/^\+?[0-9\s\-]{8,15}$/.test(value)) error = "Formato de teléfono inválido";
  }
  
  if (name === "password") {
    if (!value) error = "La contraseña es obligatoria";
    else if (!value) error = "La contraseña es obligatoria";
    else if (value.length < 9) error = "La contraseña debe tener mínimo 9 caracteres";
    else if (!isLogin && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{9,128}$/.test(value)) {
      error = "La contraseña no cumple los requisitos de seguridad";
    }
  }
  
  return error;
};

// Validador de reglas de negocio para Cotizador IA
export const validateCotizacionField = (name, value) => {
  let error = "";

  if (name === "comuna") {
    if (!value || !value.toString().trim()) {
      error = "Por favor selecciona o escribe la comuna de instalación";
    } else if (value.toString().trim().length < 2) {
      error = "El nombre de la comuna es demasiado corto";
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s\-']{2,60}$/.test(value.toString().trim())) {
      error = "La comuna contiene caracteres inválidos";
    }
  }

  if (name === "nombre") {
    if (!value || !value.toString().trim()) {
      error = "El nombre completo es obligatorio";
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]{3,60}$/.test(value.toString().trim())) {
      error = "Solo letras y espacios (entre 3 y 60 caracteres)";
    }
  }

  if (name === "email") {
    if (!value || !value.toString().trim()) {
      error = "El correo electrónico es obligatorio";
    } else if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(value.toString().trim())) {
      error = "Ingresa un correo electrónico válido (ejemplo: contacto@angloelectric.cl)";
    }
  }

  if (name === "telefono") {
    if (!value || !value.toString().trim()) {
      error = "El teléfono de contacto es obligatorio";
    } else if (!/^\+?[0-9\s\-]{8,16}$/.test(value.toString().trim())) {
      error = "Ingresa un teléfono válido (ej. +56912345678)";
    }
  }

  return error;
};
