# 📁 Documentos Externos

Esta pasta é destinada a receber documentos HTML já criados que serão integrados ao Portal de Calidad ASCH.

## 📋 Como Adicionar Documentos

### 1. Estrutura de Pastas
```
docs/
├── 01_Sistema_Gestion/          # Capítulo 01
├── 02_Plan_Ensayos/             # Capítulo 02
├── 03_Objetivos_Calidad/        # Capítulo 03
├── 04_Programacion/             # Capítulo 04
├── 05_Trazabilidad/             # Capítulo 05
├── 06_PPI/                      # Capítulo 06
├── 07_Equipos_Maquinaria/       # Capítulo 07
├── 08_Calibracion/              # Capítulo 08
├── 09_Certificados_Materiales/  # Capítulo 09
├── 10_No_Conformidades/         # Capítulo 10
├── 11_Control_Calidad/          # Capítulo 11
├── 12_Calculos_Tecnicos/        # Capítulo 12
├── 13_Control_Geometrico/       # Capítulo 13
├── 14_Control_Planos/           # Capítulo 14
├── 15_Laboratorio/              # Capítulo 15
├── 16_Documentacion_General/    # Capítulo 16
├── 17_Control_Economico/        # Capítulo 17
├── 18_Normativas/               # Capítulo 18
├── 19_Pruebas_Finales/          # Capítulo 19
├── 20_Auditorias/               # Capítulo 20
└── 21_Informes_Mensuales/       # Capítulo 21
```

### 2. Convención de Nombres
- **Formato**: `YYYY-MM-DD_titulo-documento.html`
- **Ejemplo**: `2025-09-26_PPI-control-armaduras-PK-15200.html`

### 3. Estructura del HTML
Cada documento HTML debe incluir:
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Título del Documento</title>
    <style>
        /* Estilos específicos del documento */
    </style>
</head>
<body>
    <!-- Contenido del documento -->
</body>
</html>
```

### 4. Metadatos
Cada documento debe incluir metadatos en comentarios HTML:
```html
<!--
METADATOS:
- Título: PPI - Control de armaduras PK 15+200
- Capítulo: 06
- Tags: PPI, armaduras, control, PK
- Estado: Aprobado
- Fecha: 2025-09-26
- Autor: ASCH Infraestructuras
-->
```

## 🔄 Proceso de Integración

1. **Colocar archivo** en la carpeta correspondiente
2. **Actualizar manifest.json** con la nueva entrada
3. **Verificar** que el documento se muestra correctamente
4. **Probar** funcionalidades de visualización, descarga e impresión

## 📝 Ejemplo de Entrada en manifest.json

```json
{
  "titulo": "PPI - Control de armaduras PK 15+200",
  "ruta": "docs/06_PPI/2025-09-26_PPI-control-armaduras-PK-15200.html",
  "tags": ["PPI", "armaduras", "control", "PK"],
  "fecha": "2025-09-26",
  "estado": "Aprobado"
}
```

## 🚀 Automatización

El sistema puede detectar automáticamente nuevos archivos HTML en las carpetas y sugerir su integración al manifest.json.
