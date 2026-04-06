# Hubitat - Sistema de Gestión de Rentas Cortas (SaaS)

### **Arquitectura Multi-Rol y Experiencia de Usuario para Gestión Inmobiliaria**

Este repositorio contiene la aplicación cliente (SPA) para la plataforma integral de rentas cortas. Desarrollada con **React** y **TypeScript**, la aplicación está diseñada bajo estrictos principios de ingeniería para soportar operaciones simultáneas de múltiples perfiles de usuario (SuperAdmin, Admin, Propietario y Conserje), garantizando seguridad, rendimiento y una experiencia de usuario fluida.

---

## 🚀 Retos de Ingeniería y Soluciones Aplicadas

El desarrollo de interfaces corporativas con múltiples niveles de acceso requiere un diseño de software estructurado. Para este proyecto, se aplicaron metodologías de **Ingeniería de Requisitos** e **Ingeniería de Software**:

* **Arquitectura de Acceso Granular (Multi-Rol):** Implementación de un sistema de enrutamiento protegido dinámico (`ProtectedRoute.tsx` y `AuthContext.tsx`). La interfaz muta y restringe módulos enteros dependiendo del token JWT del usuario, asegurando que un Conserje tenga una vista optimizada de control de piso, mientras un Administrador visualiza logs de auditoría y métricas globales.
* **Abstracción de la Capa de Datos:** Diseño de un cliente API modular (`src/api/`) que centraliza y tipa estáticamente (con TypeScript) todas las peticiones HTTP hacia el backend (edificios, estancias, auditoría, notificaciones). Esto facilita el mantenimiento y previene errores de integración.
* **Gestión de Estados Complejos:** Desarrollo de vistas interactivas avanzadas, como el Calendario de Reservas para Propietarios y el Panel de Control de Piso en tiempo real para Conserjes, utilizando flujos de datos unidireccionales y *custom hooks* (ej. `useReservationFilters.ts`, `useControlPiso.ts`).
* **Sistema de Peticiones y Flujos de Aprobación:** Traducción de reglas de negocio complejas en interfaces modulares (`UpsertPetitionModal`, `ReviewPetitionModal`) que permiten la interacción asíncrona entre Propietarios y Administradores para la resolución de bloqueos de sistema.

---

## 🛠️ Stack Tecnológico

* **Core:** [React 18](https://react.dev/) y **TypeScript** para un desarrollo robusto y escalable.
* **Build Tool:** [Vite](https://vitejs.dev/) para un empaquetado ultra rápido (HMR) y optimización de *assets* en producción.
* **Estilos y UI:** [Tailwind CSS](https://tailwindcss.com/) configurado mediante utilidades para interfaces responsivas, accesibles y consistentes en todos los dispositivos.
* **Despliegue:** Configuración nativa para **Vercel** (`vercel.json`), integrando flujos de CI/CD para lanzamientos continuos.

---

## 📦 Características Principales por Rol

* **Conserjería (Control de Piso):** Interfaz optimizada para operaciones rápidas. Vista de directorio en tiempo real, validación visual del estado de los departamentos y control de estancias activas.
* **Propietarios:** Dashboard personalizado, gestión de calendario visual de reservas, administración de *managers* delegados y seguimiento del estado de peticiones de desbloqueo.
* **Administradores:** Gestión de usuarios y edificios, control total sobre la aprobación/rechazo de peticiones, y acceso a registros de auditoría inalterables para resolución de conflictos.
* **SuperAdmin:** Panel global para la administración integral del ecosistema multi-tenant (múltiples edificios y residencias).

---

## ⚙️ Configuración y Desarrollo

### Requisitos Previos
* Node.js 18+
* npm, pnpm o yarn

### Instalación Local

1. Clonar el repositorio:
```bash
git clone [https://github.com/tu-usuario/frontend-rentas-cortas.git](https://github.com/tu-usuario/frontend-rentas-cortas.git)
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno (`.env`):
```env
VITE_API_URL=http://localhost:3000/api
```

4. Ejecutar el servidor de desarrollo:
```bash
npm run dev
```

### Compilación para Producción
```bash
npm run build
```
El directorio `dist/` contendrá los archivos estáticos optimizados.

---

## 🛠️ Estructura Principal del Proyecto

```text
src/
├── api/                  # Capa de abstracción de peticiones HTTP (Axios/Fetch)
├── assets/               # Recursos estáticos (imágenes, SVGs)
├── components/           # Componentes UI reutilizables (Modales, Selectores, Layouts)
├── contexts/             # Estado global de la aplicación (Autenticación)
├── hooks/                # Lógica de negocio reutilizable (Custom Hooks)
├── pages/                # Vistas segmentadas por rol
│   ├── admin/            # Vistas de Administración
│   ├── conserje/         # Vistas de Control de Piso
│   ├── propietario/      # Vistas de Inversionistas/Dueños
│   └── superadmin/       # Vistas Globales
└── utils/                # Utilidades de formato (RUT, Teléfonos, Fechas)
```
