# 🏍️ Proymotos - Backend API

Esta es la API RESTful (Backend) para la plataforma **Proymotos**, encargada de gestionar la base de datos de motocicletas, usuarios, autenticación, favoritos y reservas.

## 🛠️ Tecnologías Utilizadas

* **Node.js** y **Express 5**: Servidor web rápido y minimalista.
* **TypeScript**: Tipado estático para un código más robusto y seguro.
* **Prisma ORM (v7)**: Manejo de base de datos eficiente.
* **PostgreSQL**: Base de datos relacional (alojada en Render).
* **JWT (JSON Web Tokens)** y **Bcrypt**: Autenticación segura y encriptación de contraseñas.
* **Swagger**: Documentación automática de la API.

## 🌟 Características

* **Autenticación:** Registro de usuarios y login seguro con tokens JWT.
* **Gestión de Catálogo:** Endpoints para obtener la lista de motocicletas disponibles y filtrarlas.
* **Favoritos:** Sistema para que los usuarios puedan guardar sus motos favoritas.
* **Base de datos segura:** Las contraseñas están encriptadas y protegidas.
* **Semilla de datos (Seed):** Script integrado para rellenar la base de datos con motos de prueba.

## 🚀 Instalación y Uso Local

Para correr este proyecto en tu entorno local, asegúrate de tener Node.js instalado.

### 1. Clonar e Instalar dependencias
```bash
git clone <tu-url-del-repositorio>
cd Proymotos
npm install
```

### 2. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto tomando como referencia las variables que necesites (asegúrate de **nunca subir este archivo a GitHub**):
```env
DATABASE_URL="tu_cadena_de_conexion_postgresql"
JWT_SECRET="tu_secreto_para_tokens"
PORT=3000
```

### 3. Configurar la Base de Datos
```bash
# Sincroniza la estructura de la base de datos
npx prisma db push

# (Opcional) Rellena la base de datos con las motos de prueba
npx tsx prisma/seed.ts
```

### 4. Iniciar el Servidor
```bash
npm run dev
```
El servidor estará corriendo en `http://localhost:3000`.

## 🛡️ Notas de Seguridad
El archivo `.env` se encuentra excluido en `.gitignore` para prevenir que credenciales sensibles (claves de base de datos o secretos JWT) sean expuestas públicamente.
