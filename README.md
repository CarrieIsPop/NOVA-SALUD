# 🏥 NOVA SALUD - Sistema de Gestión de Inventario y Ventas

## 📌 Descripción del Proyecto
Nova Salud es una aplicación web transaccional desarrollada como proyecto aplicativo. El sistema resuelve la problemática del control manual de inventarios en boticas, automatizando la gestión de stock, el registro de ventas y la generación de reportes gerenciales mediante una arquitectura en la nube en tiempo real.

## 🚀 Características Principales

### 🔐 Control de Accesos por Roles (RBAC)
- **Administrador:** Acceso total al panel de control (Dashboard).
- **Cliente / Paciente:** Acceso exclusivo al catálogo digital y pasarela de compras.

### 📦 Módulo de Inventario (CRUD)
- Registro, edición y eliminación de medicamentos.
- Monitoreo de stock en tiempo real.
- **Sistema de Alertas:** Identificación visual automática de productos que alcanzan su stock mínimo (Estado Crítico).

### 💳 Módulo de Ventas y POS
- Catálogo digital interactivo.
- Simulación de pasarela de pagos integrando métodos locales (Yape / Plin) con generación de códigos QR.
- Descuento automático de stock en la base de datos tras cada transacción.

### 📊 Reportes y Auditoría (PDF)
- Generación de **Boletas de Venta Electrónicas** descargables para el cliente.
- Informe Gerencial de Existencias (ordenado por prioridad de stock crítico).
- Reporte Contable de Ventas Mensuales con cálculo automático de ingresos totales.

## 🛠️ Tecnologías Utilizadas
- **Frontend:** React.js, Vite.
- **Estilos:** Tailwind CSS.
- **Backend as a Service (BaaS):** Firebase (Authentication & Firestore Database).
- **Librerías Adicionales:** React Router DOM (Enrutamiento), jsPDF y jsPDF-AutoTable (Generación de documentos PDF).
