import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  validateAuthField, 
  sanitizePhone, 
  sanitizeName, 
  sanitizeEmail, 
  sanitizePassword 
} from "@/src/utils/validations";
import { authService } from "@/src/services/api";

export function useAuthForm(onSuccess) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true); 
  
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
  });

  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" }); // type: "success" | "error"

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    setStatusMessage({ text: "", type: "" }); // Limpiar mensaje al escribir

    if (name === "telefono") newValue = sanitizePhone(value);
    if (name === "nombre") newValue = sanitizeName(value);
    if (name === "email") newValue = sanitizeEmail(value);
    if (name === "password") newValue = sanitizePassword(value);

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => ({ ...prev, [name]: validateAuthField(name, newValue, isLogin) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: validateAuthField(name, value, isLogin) }));
  };

  const getFieldClasses = (name) => {
    if (errors[name]) return "border-red-500 focus:border-red-500 focus:ring-red-500";
    if (formData[name] && !errors[name]) return "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500";
    return "border-gray-200 focus:border-[#00fc82] focus:ring-[#00fc82]";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ text: "", type: "" });
    
    const newErrors = {
      nombre: !isLogin ? validateAuthField("nombre", formData.nombre, isLogin) : "",
      email: validateAuthField("email", formData.email, isLogin),
      telefono: !isLogin ? validateAuthField("telefono", formData.telefono, isLogin) : "",
      password: validateAuthField("password", formData.password, isLogin),
    };
    
    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err !== "")) return;

    try {
      if (isLogin) {
        const response = await authService.login(formData.email, formData.password);
        const token = response.access_token;
        localStorage.setItem("token", token);
        
        // Decodificar token para ver si es admin o cliente
        let esAdmin = false;
        try {
          const base64Url = token.split('.')[1];
          let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          const payload = JSON.parse(window.atob(base64));
          if (payload.rol_id === 1) {
            esAdmin = true;
          }
        } catch (e) {
          console.error("Error decodificando token:", e);
        }

        // Notificar cambio de autenticacion a Navbar y demas componentes
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth-change"));
        }

        setStatusMessage({ text: "Inicio de sesión exitoso. Redirigiendo...", type: "success" });

        setTimeout(() => {
          if (onSuccess && typeof onSuccess === "function") {
            onSuccess();
          }
          if (esAdmin) {
            router.push("/admin");
          }
          router.refresh();
        }, 500);
      } else {
        await authService.register({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          telefono: formData.telefono || null,
          rol_id: 2 // Por defecto cliente
        });
        setStatusMessage({ text: "Cuenta creada con éxito. Ahora puedes iniciar sesión.", type: "success" });
        setTimeout(() => {
          toggleView();
        }, 1200);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setErrors({ ...newErrors, email: "Correo o contraseña incorrectos" });
      } else if (error.response && error.response.status === 400) {
        setStatusMessage({ text: "El correo ya está registrado.", type: "error" });
      } else {
        setStatusMessage({ text: "Error de conexión con el servidor.", type: "error" });
      }
    }
  };

  const toggleView = () => {
    setIsLogin(!isLogin);
    setFormData({ nombre: "", email: "", password: "", telefono: "" });
    setErrors({});
    setStatusMessage({ text: "", type: "" });
  };

  return {
    isLogin,
    formData,
    errors,
    handleChange,
    handleBlur,
    getFieldClasses,
    handleSubmit,
    toggleView,
    statusMessage
  };
}
