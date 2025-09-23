const fs = require('fs');
const path = require('path');

// Função para escanear pastas e adicionar arquivos ao manifest
function adicionarArquivosAoManifest() {
    const manifestPath = 'data/manifest.json';
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Função para escanear uma pasta recursivamente
    function scanFolder(folderPath, relativePath = '') {
        const items = [];
        
        try {
            const files = fs.readdirSync(folderPath);
            
            files.forEach(file => {
                const fullPath = path.join(folderPath, file);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // Se é uma pasta, escanear recursivamente
                    const subItems = scanFolder(fullPath, path.join(relativePath, file));
                    items.push(...subItems);
                } else if (stat.isFile() && !file.startsWith('.')) {
                    // Se é um arquivo, adicionar à lista
                    const fileExtension = path.extname(file).toLowerCase();
                    let tipo = 'documento';
                    
                    switch (fileExtension) {
                        case '.pdf':
                            tipo = 'pdf';
                            break;
                        case '.doc':
                        case '.docx':
                            tipo = 'word';
                            break;
                        case '.xls':
                        case '.xlsx':
                            tipo = 'excel';
                            break;
                        case '.html':
                            tipo = 'html';
                            break;
                        case '.jpg':
                        case '.jpeg':
                        case '.png':
                            tipo = 'imagem';
                            break;
                        default:
                            tipo = 'documento';
                    }
                    
                    const rutaCompleta = path.join('docs', relativePath, file).replace(/\\/g, '/');
                    const nombre = path.parse(file).name.replace(/_/g, ' ').replace(/-/g, ' ');
                    
                    items.push({
                        nombre: nombre,
                        tipo: tipo,
                        ruta: rutaCompleta,
                        descripcion: `Documento ${tipo.toUpperCase()} - ${nombre}`
                    });
                }
            });
        } catch (error) {
            console.log(`Erro ao escanear pasta ${folderPath}:`, error.message);
        }
        
        return items;
    }
    
    // Escanear todas as pastas docs
    const docsPath = 'docs';
    if (fs.existsSync(docsPath)) {
        const arquivosEncontrados = scanFolder(docsPath);
        
        console.log(`\n📁 ARQUIVOS ENCONTRADOS: ${arquivosEncontrados.length}`);
        arquivosEncontrados.forEach(arquivo => {
            console.log(`  📄 ${arquivo.nombre} (${arquivo.tipo}) - ${arquivo.ruta}`);
        });
        
        // Adicionar arquivos aos subcapítulos correspondentes
        arquivosEncontrados.forEach(arquivo => {
            const rutaParts = arquivo.ruta.split('/');
            
            // Encontrar capítulo e subcapítulo baseado na estrutura
            if (rutaParts.length >= 4) {
                const codigoCapitulo = rutaParts[1].split('_')[0]; // ex: "02" de "02_Plan_Ensayos_Controles"
                const codigoSubcapitulo = rutaParts[2].split('-')[0] + '-' + rutaParts[2].split('-')[1]; // ex: "02-01" de "02.01-Plan_Ensayos"
                
                // Encontrar seção no manifest
                const secao = manifest.secciones.find(s => s.codigo === codigoCapitulo);
                if (secao) {
                    const subcapitulo = secao.subcapitulos.find(sub => sub.codigo === codigoSubcapitulo);
                    if (subcapitulo) {
                        // Verificar se arquivo já existe
                        const arquivoExiste = subcapitulo.items.some(item => item.ruta === arquivo.ruta);
                        if (!arquivoExiste) {
                            subcapitulo.items.push(arquivo);
                            console.log(`✅ Adicionado: ${arquivo.nombre} ao ${codigoCapitulo}-${codigoSubcapitulo}`);
                        } else {
                            console.log(`⚠️  Já existe: ${arquivo.nombre} em ${codigoCapitulo}-${codigoSubcapitulo}`);
                        }
                    }
                }
            }
        });
        
        // Salvar manifest atualizado
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`\n✅ MANIFEST ATUALIZADO: ${manifestPath}`);
    }
}

// Executar função
adicionarArquivosAoManifest();
