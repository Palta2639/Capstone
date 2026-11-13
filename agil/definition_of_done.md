# Definition of Done (DoD) – Anglo Electric

> Propuesta elaborada por QA (Kevin Peña). Debe ser validada por el equipo en la próxima ceremonia Scrum.

Una historia de usuario se considera **terminada** cuando cumple todos los siguientes criterios:

## Código
- [ ] El código está subido a una rama propia y se integró a `Main` mediante un Pull Request revisado por otro integrante.
- [ ] No contiene credenciales, contraseñas ni claves escritas en el código; se usan variables de entorno (`.env`).
- [ ] Las dependencias nuevas están registradas en `requirements.txt` (backend) o `package.json` (frontend).

## Pruebas
- [ ] Se cumplen todos los criterios de aceptación de la historia de usuario.
- [ ] Existen casos de prueba documentados en el plan de pruebas (`docs/05_pruebas/plan_pruebas.pdf`).
- [ ] Las pruebas unitarias del backend (`tests/unitarias/`) se ejecutan con `pytest` sin fallas críticas.
- [ ] Los defectos de severidad Crítico o Grave asociados están corregidos.
- [ ] Las evidencias (capturas) están guardadas en `evidencias/pruebas/`.

## Seguridad
- [ ] Las rutas que modifican datos están protegidas con token JWT y validación de rol.
- [ ] Las contraseñas se almacenan cifradas con Bcrypt.
- [ ] Las validaciones de datos se aplican en el backend, no solo en el frontend.

## Despliegue y documentación
- [ ] El proyecto se levanta con `docker compose up --build` sin errores.
- [ ] El README y la documentación en `docs/` están actualizados con los cambios.
- [ ] La matriz de trazabilidad (`docs/trazabilidad.xlsx`) refleja el estado de la historia.
