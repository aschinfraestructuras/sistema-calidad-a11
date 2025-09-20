# Como Adicionar Arquivos HTML ao Sistema

## ❗ IMPORTANTE: Por que não basta colocar o arquivo HTML?

O sistema **NÃO** detecta automaticamente novos arquivos HTML. Você precisa atualizar o arquivo `data/manifest.json` para que o sistema saiba que o arquivo existe.

## 📋 Passo a Passo

### 1. Coloque o arquivo HTML na pasta correta
```
registros/04_Programacion_y_Comunicaciones/  ← Para capítulo 04
registros/05_Trazabilidad/                   ← Para capítulo 05
docs/06_PPI/                                 ← Para capítulo 06
etc...
```

### 2. Edite o arquivo `data/manifest.json`

Encontre o capítulo correto e adicione uma nova entrada no array `items`:

```json
{
  "codigo": "04",
  "titulo": "Programación y Comunicaciones de Obra",
  "items": [
    {
      "titulo": "Nome do seu arquivo HTML",
      "ruta": "caminho/para/seu/arquivo.html",
      "tags": ["tag1", "tag2", "tag3"],
      "fecha": "2025-09-26",
      "estado": "Aprobado",
      "descripcion": "Descrição do arquivo (opcional)"
    }
  ]
}
```

### 3. Exemplo Prático

Se você criou um arquivo chamado `meu-documento.html` na pasta `registros/04_Programacion_y_Comunicaciones/`:

```json
{
  "titulo": "Meu Documento de Teste",
  "ruta": "registros/04_Programacion_y_Comunicaciones/meu-documento.html",
  "tags": ["teste", "documento", "novo"],
  "fecha": "2025-09-26",
  "estado": "Aprobado",
  "descripcion": "Documento de teste para verificar o sistema"
}
```

### 4. Recarregue a página

Após editar o `manifest.json`, recarregue a página no navegador (F5) para ver as mudanças.

## 🚀 Alternativa: Usar Upload

Se não quiser editar o `manifest.json`, você pode usar a função de **Upload** do sistema:

1. Clique em "Subir Documento"
2. Selecione seu arquivo HTML
3. Escolha o capítulo
4. Adicione título e tags
5. Clique em "Subir"

O arquivo será adicionado automaticamente e aparecerá no capítulo escolhido.

## 🔧 Para Desenvolvedores

Se você tem acesso ao console do navegador, pode usar a função:

```javascript
portal.addHtmlToManifest('04', 'Título do Documento', 'caminho/arquivo.html', ['tag1', 'tag2'], 'Descrição');
```

## ⚠️ Problemas Comuns

1. **Arquivo não aparece**: Verifique se está no `manifest.json`
2. **Caracteres estranhos**: Certifique-se que o arquivo HTML tem `<meta charset="UTF-8">`
3. **Erro 404**: Verifique se o caminho no `manifest.json` está correto
4. **Não atualiza**: Recarregue a página (F5) após editar o manifest

## 📁 Estrutura de Pastas

```
sistema-calidad-a11/
├── data/
│   └── manifest.json          ← ARQUIVO PRINCIPAL
├── registros/
│   ├── 01_PAC/
│   ├── 04_Programacion_y_Comunicaciones/  ← Capítulo 04
│   ├── 05_Trazabilidad/                   ← Capítulo 05
│   └── ...
├── docs/
│   ├── 04_Programacion/
│   ├── 06_PPI/
│   └── ...
└── index.html
```

## ✅ Checklist

- [ ] Arquivo HTML criado na pasta correta
- [ ] Arquivo HTML tem `<meta charset="UTF-8">`
- [ ] Entrada adicionada ao `manifest.json`
- [ ] Caminho no manifest está correto
- [ ] Página recarregada (F5)
- [ ] Arquivo aparece no capítulo correto
