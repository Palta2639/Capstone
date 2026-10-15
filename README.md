# Anglo Electric - Plataforma E-Commerce y Dimensionador Solar

Plataforma web modular para la venta de equipos solares fotovoltaicos, asesoría técnica con IA y cotizador solar automatizado para Chile.

---

## Requisitos Previos

* **Node.js** >= 18.17 (LTS recomendado)
* **Python** >= 3.10
* **Git**

---

## Guía Rápida para Levantar el Proyecto

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
cd AngloElectric-Project
```

---

### 2. Levantar el Backend (FastAPI)

1. Ingresar a la carpeta del backend:
   ```bash
   cd backend
   ```

2. Crear y activar el entorno virtual:
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```

3. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

4. Crear el archivo `.env` en la carpeta `backend/` con las credenciales de la base de datos:
   ```ini
   DATABASE_URL="postgresql://usuario:password@host/neondb?sslmode=require"
   SECRET_KEY="clave_secreta_jwt"
   ```

5. Iniciar el servidor backend:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   * El backend quedará corriendo en: `http://localhost:8000`
   * Documentación interactiva Swagger: `http://localhost:8000/docs`

---

### 3. Levantar el Frontend (Next.js)

1. En una nueva terminal, ingresar a la carpeta del frontend:
   ```bash
   cd frontend
   ```

2. Instalar dependencias de Node:
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   * La aplicación estará disponible en: `http://localhost:3000`

---

### 4. Alternativa con Docker 

 Docker y Docker Compose instalado en tu equipo:
```bash
docker-compose up --build
```

