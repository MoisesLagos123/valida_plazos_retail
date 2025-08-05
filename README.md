# Valida Plazos Retail

Sistema para validación de plazos en el sector retail desarrollado con Node.js y Express.

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js >= 16.0.0
- npm o yarn

### Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/MoisesLagos123/valida_plazos_retail.git
cd valida_plazos_retail
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
# Edita el archivo .env con tus configuraciones
```

4. Inicia el servidor:
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

## 📁 Estructura del Proyecto

```
valida_plazos_retail/
├── src/
│   ├── controllers/    # Controladores de la aplicación
│   ├── models/         # Modelos de datos
│   ├── routes/         # Definición de rutas
│   ├── middleware/     # Middlewares personalizados
│   ├── utils/          # Funciones utilitarias
│   ├── scraping/       # Módulos de scraping
│   │   └── login/      # Funcionalidades de login
│   └── index.js        # Punto de entrada de la aplicación
├── tests/              # Pruebas unitarias e integración
├── .env.example        # Ejemplo de variables de entorno
├── .gitignore         # Archivos ignorados por Git
├── package.json       # Configuración del proyecto
└── README.md          # Este archivo
```

## 🛠️ Scripts Disponibles

- `npm start` - Inicia el servidor en modo producción
- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon
- `npm test` - Ejecuta las pruebas
- `npm run test:watch` - Ejecuta las pruebas en modo watch

## 📋 API Endpoints

### Básicos

- `GET /` - Información general de la API
- `GET /health` - Estado de salud del servidor

## 🛡️ Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura las siguientes variables:

```env
PORT=3000                    # Puerto del servidor
NODE_ENV=development         # Entorno (development, production)
```

## 🧪 Testing

Para ejecutar las pruebas:

```bash
npm test
```

Para ejecutar las pruebas en modo watch:

```bash
npm run test:watch
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autor

- **MoisesLagos123** - [GitHub](https://github.com/MoisesLagos123)

## 🔧 Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **CORS** - Habilitación de CORS
- **Moment.js** - Manejo de fechas
- **Jest** - Framework de testing  
- **Nodemon** - Desarrollo (hot reload)

## 📊 Estado del Proyecto

- ✅ Configuración inicial
- ✅ Estructura de carpetas
- ✅ Servidor básico con Express
- ✅ Módulos de scraping organizados
- 🔄 En desarrollo...

## 🚧 Próximas Funcionalidades

- [ ] Sistema de autenticación
- [ ] Conexión a base de datos
- [ ] Validación de plazos específicos
- [ ] API REST completa
- [ ] Funcionalidades de scraping
- [ ] Documentación con Swagger
- [ ] Tests unitarios
- [ ] Docker containerization