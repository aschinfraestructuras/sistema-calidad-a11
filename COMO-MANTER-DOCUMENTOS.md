# Como Manter Documentos Subidos

## 📋 **Resumo das Questões:**

### 1. ✅ **Visualização em Tela Cheia**
- **Funciona em TODOS os 21 capítulos**
- **Qualquer documento HTML** (manifest ou subido) terá visualização otimizada
- **98% da tela** com margem pequena para melhor visualização

### 2. 💾 **Problema dos Uploads Desaparecerem**

## 🔍 **Por que os uploads desaparecem?**

### **Local vs Vercel:**
- **Local**: Dados ficam no `localStorage` do navegador
- **Vercel**: Dados ficam no `localStorage` do navegador
- **Ambos**: Dados são temporários e podem ser perdidos

### **Quando os dados são perdidos:**
1. **Limpar cache do navegador**
2. **Modo incógnito/privado**
3. **Navegador diferente**
4. **Reinstalar navegador**
5. **Limpar dados do site**

## 🛠️ **Soluções Implementadas:**

### **1. Sistema de Backup Duplo:**
- **localStorage**: Armazenamento principal
- **sessionStorage**: Backup automático
- **Recuperação automática** se um falhar

### **2. Logs Detalhados:**
- Console mostra onde os dados estão sendo salvos
- Avisos quando documentos são carregados
- Informações sobre backup

## 📤 **Alternativas para Manter Documentos:**

### **Opção 1: Adicionar ao Manifest (Recomendado)**
```json
{
  "titulo": "Seu Documento",
  "ruta": "caminho/para/arquivo.html",
  "tags": ["tag1", "tag2"],
  "fecha": "2025-09-26",
  "estado": "Aprobado"
}
```

### **Opção 2: Usar Upload (Temporário)**
- ✅ Fácil de usar
- ❌ Pode ser perdido
- ✅ Funciona em todos os capítulos

### **Opção 3: Deploy no Vercel**
- ✅ Mais estável
- ✅ Acesso de qualquer lugar
- ❌ Ainda usa localStorage

## 🚀 **Recomendação:**

### **Para Documentos Importantes:**
1. **Crie o arquivo HTML**
2. **Coloque na pasta correta** (ex: `registros/04_Programacion_y_Comunicaciones/`)
3. **Edite o `data/manifest.json`** para adicionar a entrada
4. **Faça commit e push** para o Vercel

### **Para Testes Rápidos:**
1. **Use o sistema de upload**
2. **Teste a visualização**
3. **Se gostar, adicione ao manifest**

## 📁 **Estrutura Recomendada:**

```
sistema-calidad-a11/
├── data/
│   └── manifest.json          ← ADICIONAR AQUI
├── registros/
│   ├── 01_PAC/
│   ├── 04_Programacion_y_Comunicaciones/  ← SEUS ARQUIVOS
│   ├── 05_Trazabilidad/
│   └── ...
└── index.html
```

## ⚠️ **Importante:**

- **Upload**: Para testes e documentos temporários
- **Manifest**: Para documentos permanentes
- **Vercel**: Para acesso online estável
- **Local**: Para desenvolvimento e testes

## 🔧 **Comandos Úteis:**

### **Para ver logs no console:**
1. Pressione **F12** no navegador
2. Vá na aba **Console**
3. Veja as mensagens de carregamento/salvamento

### **Para limpar dados:**
```javascript
// No console do navegador:
localStorage.clear();
sessionStorage.clear();
```

## ✅ **Checklist:**

- [ ] Documentos importantes adicionados ao manifest.json
- [ ] Arquivos HTML na pasta correta
- [ ] Teste de visualização em tela cheia
- [ ] Deploy no Vercel para acesso online
- [ ] Backup dos dados importantes
