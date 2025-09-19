# 🏗️ Portal de Calidad ASCH - A-11 (Langa - Aranda)

Portal web estático para centralizar y publicar toda la documentación de calidad de obra de ASCH Infraestructuras y Servicios en el tramo A-11.

## 📋 Características Principales

- **21 Capítulos organizados** según estructura ISO de calidad
- **Búsqueda avanzada** por texto y tags
- **Sistema de filtros** por estado y fecha
- **Vista responsive** para todos los dispositivos
- **Modo oscuro/claro** con preferencias del usuario
- **Acceso directo** a documentos HTML/PDF
- **Sin servidor** - completamente estático

## 🚀 Acceso Rápido

### GitHub Pages
- **URL**: `https://seuusername.github.io/claude-files-organizer`
- **Estado**: ✅ Activo
- **Última actualización**: Automática con cada commit

### Local
```bash
# Clonar repositorio
git clone https://github.com/seuusername/claude-files-organizer.git
cd claude-files-organizer

# Servidor local (Python)
python -m http.server 8000

# Servidor local (Node.js)
npx serve .

# Acceder
http://localhost:8000
```

## 📁 Estructura del Proyecto

```
claude-files-organizer/
├── index.html                 # Página principal
├── assets/
│   ├── styles.css            # Estilos (modo oscuro/claro)
│   └── app.js                # Lógica de la aplicación
├── data/
│   └── manifest.json         # Catálogo maestro de documentos
├── registros/                # Documentos organizados por capítulos
│   ├── 01_PAC/
│   ├── 02_Plan_Ensayos/
│   ├── 03_Objetivos_Calidad/
│   ├── 04_Programacion_y_Comunicaciones/
│   ├── 05_Trazabilidad/
│   ├── 06_PPI/
│   ├── 07_Equipos_Maquinaria_Tajos/
│   ├── 08_Calibracion/
│   ├── 09_Certificados_y_Materiales/
│   ├── 10_No_Conformidades/
│   ├── 11_Control_Calidad_Asistencia/
│   ├── 12_Calculos_y_Notas_Tecnicas/
│   ├── 13_Control_Geometrico/
│   ├── 14_Control_Planos/
│   ├── 15_Laboratorio/
│   ├── 16_Documentacion_General/
│   ├── 17_Control_Economico_Calidad_Obra/
│   ├── 18_Normativas/
│   ├── 19_Pruebas_Finales/
│   ├── 20_Auditorias/
│   └── 21_Informes_Mensuales/
└── README.md                 # Este archivo
```

## 📝 Cómo Añadir Documentos

### Método 1: A través del Portal Web
1. **Subir archivo** a la carpeta correspondiente en `/registros/`
2. **Editar** `data/manifest.json`
3. **Añadir entrada** en la sección correspondiente
4. **Commit y push** - el documento aparece automáticamente

### Método 2: Edición Directa del Manifest

Editar `data/manifest.json` y añadir una entrada:

```json
{
  "codigo": "04",
  "titulo": "Programación y Comunicaciones de Obra",
  "items": [
    {
      "titulo": "Solicitud de apertura de tajo – PI 26+950",
      "ruta": "registros/04_Programacion_y_Comunicaciones/2025-09-19_apertura-tajo_PI-26950.html",
      "tags": ["PPI", "apertura", "obra", "tajo"],
      "fecha": "2025-09-19",
      "estado": "Aprobado"
    }
  ]
}
```

### Convención de Nombres

**Archivos**: `AAAA-MM-DD_PK-tipo.html`
- Ejemplo: `2025-09-26_PI-26950_placa-k.html`

**Tags normalizados**:
```json
["PPI", "suelos", "PG-3", "placa", "k", "DF", "material", 
 "impermeabilización", "ensayo", "cimentación", "hormigón", 
 "armaduras", "control", "calidad", "auditoría"]
```

## 🎯 Capítulos de Calidad

| Código | Título | Descripción |
|--------|--------|-------------|
| **01** | PAC | Plan de Aseguramiento de la Calidad |
| **02** | Plan de Ensayos | Plan de Ensayos y Controles |
| **03** | Objetivos | Objetivos y Política de Calidad |
| **04** | Programación | Programación y Comunicaciones |
| **05** | Trazabilidad | Trazabilidad de Materiales |
| **06** | PPI | Puntos de Inspección y Control |
| **07** | Equipos | Equipos, Maquinaria y Tajos |
| **08** | Calibración | Calibración de Equipos |
| **09** | Certificados | Certificados y Materiales |
| **10** | No Conformidades | No Conformidades y Acciones |
| **11** | Asistencia | Control de Calidad y Asistencia |
| **12** | Cálculos | Cálculos y Notas Técnicas |
| **13** | Geométrico | Control Geométrico |
| **14** | Planos | Control de Planos |
| **15** | Laboratorio | Laboratorio y Ensayos |
| **16** | Documentación | Documentación General |
| **17** | Económico | Control Económico de Calidad |
| **18** | Normativas | Normativas y Reglamentos |
| **19** | Pruebas | Pruebas Finales |
| **20** | Auditorías | Auditorías de Calidad |
| **21** | Informes | Informes Mensuales |

## 🔍 Funcionalidades

### Búsqueda
- **Texto libre**: Busca en títulos y descripciones
- **Tags**: Usa `#tag` para buscar por etiquetas
- **Filtros**: Por estado (Aprobado/Borrador/Obsoleto) y fecha

### Navegación
- **Menú lateral**: Acceso rápido a los 21 capítulos
- **Breadcrumbs**: Navegación contextual
- **Vista grid/lista**: Alternar entre vistas

### Documentos
- **Preview**: Visualización directa de HTML
- **Download**: Descarga de documentos
- **Print**: Impresión directa
- **Responsive**: Adaptado a móviles

## 🛠️ Desarrollo

### Tecnologías
- **HTML5**: Estructura semántica
- **CSS3**: Estilos modernos con variables CSS
- **JavaScript ES6+**: Lógica de la aplicación
- **Sin frameworks**: Vanilla JS para máximo rendimiento

### Personalización

#### Cambiar Colores
Editar variables CSS en `assets/styles.css`:
```css
:root {
    --primary-color: #2563eb;    /* Color principal */
    --accent-color: #f59e0b;     /* Color de acento */
    --success-color: #10b981;    /* Color de éxito */
}
```

#### Añadir Nuevas Secciones
1. Crear carpeta en `/registros/`
2. Añadir entrada en `manifest.json`
3. Actualizar descripción en `app.js`

## 📱 Responsive Design

- **Desktop**: 1200px+ (Vista completa)
- **Tablet**: 768px - 1199px (Sidebar colapsable)
- **Mobile**: < 768px (Vista vertical)

## 🔒 Seguridad y Privacidad

- **Sin backend**: No hay servidor que procese datos
- **LocalStorage**: Preferencias guardadas localmente
- **HTTPS**: GitHub Pages con SSL automático
- **Sin cookies**: No se almacenan datos de usuario

## 🚀 Deploy

### GitHub Pages (Automático)
1. **Push** a la rama `main`
2. **GitHub Actions** despliega automáticamente
3. **Disponible** en 2-3 minutos

### Otros Servicios
- **Netlify**: Drag & drop del repositorio
- **Vercel**: `vercel --prod`
- **Firebase**: `firebase deploy`

## 📊 Estadísticas

- **21 Capítulos** organizados
- **Documentos activos**: Se actualiza automáticamente
- **Búsqueda en tiempo real**
- **Carga instantánea** (< 1 segundo)

## 🤝 Contribuciones

### Flujo de Trabajo
1. **Fork** del repositorio
2. **Crear rama**: `git checkout -b feature/nueva-funcionalidad`
3. **Commit**: `git commit -m 'Añadir nueva funcionalidad'`
4. **Push**: `git push origin feature/nueva-funcionalidad`
5. **Pull Request**: Crear PR en GitHub

### Estándares
- **Commits**: Mensajes descriptivos en español
- **Código**: Comentarios en español
- **Documentos**: Formato HTML estándar
- **Nombres**: Convención establecida

## 📞 Soporte

### Problemas Comunes

**El portal no carga**:
- Verificar que todos los archivos están en el repositorio
- Comprobar que GitHub Pages está activado
- Esperar 2-3 minutos para el despliegue

**Documentos no aparecen**:
- Verificar que JavaScript está habilitado
- Comprobar la consola del navegador
- Validar el formato del `manifest.json`

**Búsqueda no funciona**:
- Limpiar filtros con el botón "Limpiar filtros"
- Verificar que los tags están bien escritos
- Comprobar que el texto de búsqueda es correcto

### Contacto
- **Issues**: [GitHub Issues](https://github.com/seuusername/claude-files-organizer/issues)
- **Email**: [Tu email]
- **Equipo**: ASCH Infraestructuras y Servicios

## 📈 Roadmap

### Fase 1 (Actual) ✅
- [x] Portal estático funcional
- [x] 21 capítulos organizados
- [x] Búsqueda y filtros
- [x] Responsive design
- [x] GitHub Pages

### Fase 2 (Futuro) 🔄
- [ ] Integración con Supabase
- [ ] Formularios editables
- [ ] Sistema de firmas
- [ ] Notificaciones
- [ ] Backup automático

### Fase 3 (Avanzado) 🚀
- [ ] API REST
- [ ] Aplicación móvil
- [ ] Integración con ERP
- [ ] IA para clasificación
- [ ] Análisis de datos

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**Desarrollado con ❤️ para ASCH Infraestructuras y Servicios**

*Portal de Calidad A-11 • Tramo Langa de Duero - Aranda de Duero*