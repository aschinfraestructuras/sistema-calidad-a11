// Portal de Calidad - Sistema Simples e Funcional
console.log('🚀 Carregando Portal de Calidad...');

class PortalCalidad {
    constructor() {
        this.manifest = null;
        this.currentChapter = null;
        this.uploadedDocuments = [];
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando Portal...');
        try {
            await this.loadManifest();
            this.setupEvents();
            this.renderChapters();
            this.updateStats();
            this.loadUploadedDocuments();
            console.log('✅ Portal pronto!');
        } catch (error) {
            console.error('❌ Erro:', error);
            this.showToast('Erro ao carregar', 'error');
        }
    }

    async loadManifest() {
        console.log('📋 Carregando manifest...');
        const response = await fetch('data/manifest.json');
        this.manifest = await response.json();
        console.log('✅ Manifest carregado:', this.manifest.secciones.length, 'capítulos');
    }

    setupEvents() {
        console.log('🔧 Configurando eventos...');
        
        // Busca
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchDocuments(e.target.value);
            });
        }

        // Botões principais
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.showUpload());
        }

        const submitUploadBtn = document.getElementById('submitUpload');
        if (submitUploadBtn) {
            submitUploadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleUpload();
            });
        }

        const dashboardBtn = document.getElementById('dashboardBtn');
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', () => this.showDashboard());
        }

        const addDocumentBtn = document.getElementById('addDocumentBtn');
        console.log('addDocumentBtn encontrado:', addDocumentBtn);
        if (addDocumentBtn) {
            addDocumentBtn.addEventListener('click', () => {
                console.log('🖱️ Clique no botão Añadir Documento');
                this.showUpload();
            });
        }

        // Upload
        const closeUploadModal = document.getElementById('closeUploadModal');
        if (closeUploadModal) {
            closeUploadModal.addEventListener('click', () => this.hideUpload());
        }

        const cancelUpload = document.getElementById('cancelUpload');
        if (cancelUpload) {
            cancelUpload.addEventListener('click', () => this.hideUpload());
        }

        // Fechar modal clicando no overlay
        const uploadModal = document.getElementById('uploadModal');
        if (uploadModal) {
            uploadModal.addEventListener('click', (e) => {
                if (e.target === uploadModal || e.target.classList.contains('modal-overlay')) {
                    this.hideUpload();
                }
            });
        }

        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUpload();
            });
        }

        // Arquivo
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFile(e.target.files[0]);
            });
        }

        const selectFileBtn = document.querySelector('.select-file-btn');
        if (selectFileBtn) {
            selectFileBtn.addEventListener('click', () => {
                document.getElementById('fileInput').click();
            });
        }

        // Também permitir clicar na área de upload
        const uploadArea = document.getElementById('fileUploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('click', (e) => {
                if (e.target === uploadArea || e.target.classList.contains('upload-placeholder')) {
                    document.getElementById('fileInput').click();
                }
            });
        }

        // Botão de remover arquivo
        const removeFileBtn = document.getElementById('removeFileBtn');
        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', () => {
                this.removeSelectedFile();
            });
        }

        // Viewer
        const closeViewerModal = document.getElementById('closeViewerModal');
        if (closeViewerModal) {
            closeViewerModal.addEventListener('click', () => this.hideViewer());
        }

        const printBtn = document.getElementById('printBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => this.printDoc());
        }

        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadDoc());
        }

        // Fechar modal do viewer clicando no overlay
        const viewerModal = document.getElementById('viewerModal');
        if (viewerModal) {
            viewerModal.addEventListener('click', (e) => {
                if (e.target === viewerModal || e.target.classList.contains('modal-overlay')) {
                    this.hideViewer();
                }
            });
        }

        // Fechar com tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideUpload();
                this.hideViewer();
            }
        });

        console.log('✅ Eventos configurados');
    }

    renderChapters() {
        console.log('📚 Renderizando capítulos...');
        if (!this.manifest) {
            console.error('❌ Manifest não carregado');
            return;
        }

        const chaptersList = document.getElementById('chaptersList');
        if (!chaptersList) {
            console.error('❌ Elemento chaptersList não encontrado');
            return;
        }

        chaptersList.innerHTML = '';
        
        this.manifest.secciones.forEach(section => {
            const chapterElement = this.createChapterElement(section);
            chaptersList.appendChild(chapterElement);
        });
        
        this.populateChapterSelect();
        console.log('✅ Capítulos renderizados');
    }

    createChapterElement(section) {
        const chapterDiv = document.createElement('div');
        chapterDiv.className = 'chapter-item';
        chapterDiv.dataset.chapter = section.codigo;
        
        const itemCount = (section.items || []).length;
        const uploadedCount = this.getUploadedCountForChapter(section.codigo);
        const totalCount = itemCount + uploadedCount;
        
        chapterDiv.innerHTML = `
            <div class="chapter-header">
                <span class="chapter-code">${section.codigo}</span>
                <span class="chapter-count-badge">${totalCount}</span>
            </div>
            <div class="chapter-title">${section.titulo}</div>
        `;
        
        chapterDiv.addEventListener('click', () => {
            console.log('📖 Selecionando capítulo:', section.codigo);
            this.selectChapter(section);
        });
        
        return chapterDiv;
    }

    getUploadedCountForChapter(chapterCode) {
        return this.uploadedDocuments.filter(doc => doc.chapter === chapterCode).length;
    }

    populateChapterSelect() {
        const select = document.getElementById('documentChapter');
        if (!select) return;
        
        select.innerHTML = '<option value="">Seleccionar capítulo...</option>';
        this.manifest.secciones.forEach(section => {
            const option = document.createElement('option');
            option.value = section.codigo;
            option.textContent = `${section.codigo} - ${section.titulo}`;
            select.appendChild(option);
        });
    }

    selectChapter(section) {
        console.log('📖 Capítulo selecionado:', section.titulo);
        
        // Remover active de todos os capítulos
        document.querySelectorAll('.chapter-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Adicionar active ao capítulo selecionado
        const selectedItem = document.querySelector(`[data-chapter="${section.codigo}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
        
        this.currentChapter = section;
        this.showDocumentsSection();
        this.updateBreadcrumb(section);
        this.renderDocuments();
    }

    showDocumentsSection() {
        const welcomeSection = document.getElementById('welcomeSection');
        const documentsSection = document.getElementById('documentsSection');
        
        if (welcomeSection) welcomeSection.classList.add('hidden');
        if (documentsSection) documentsSection.classList.remove('hidden');
    }

    showDashboard() {
        console.log('📊 Mostrando dashboard');
        const welcomeSection = document.getElementById('welcomeSection');
        const documentsSection = document.getElementById('documentsSection');
        
        if (welcomeSection) welcomeSection.classList.remove('hidden');
        if (documentsSection) documentsSection.classList.add('hidden');
        
        document.querySelectorAll('.chapter-item').forEach(item => {
            item.classList.remove('active');
        });
        
        this.updateStats();
    }

    updateBreadcrumb(section) {
        const breadcrumb = document.getElementById('breadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = `
                <span class="breadcrumb-item">Inicio</span>
                <span class="breadcrumb-item active">${section.codigo} - ${section.titulo}</span>
            `;
        }
    }

    renderDocuments() {
        console.log('📄 Renderizando documentos...');
        if (!this.currentChapter) {
            console.error('❌ Nenhum capítulo selecionado');
            return;
        }
        
        const documentsGrid = document.getElementById('documentsGrid');
        const sectionTitle = document.getElementById('sectionTitle');
        const sectionCode = document.getElementById('sectionCode');
        const documentCount = document.getElementById('documentCount');
        
        if (!documentsGrid) {
            console.error('❌ Elemento documentsGrid não encontrado');
            return;
        }
        
        const manifestDocs = this.currentChapter.items || [];
        const uploadedDocs = this.uploadedDocuments.filter(doc => doc.chapter === this.currentChapter.codigo);
        const allDocs = [...manifestDocs, ...uploadedDocs];
        
        console.log('📄 Documentos encontrados:', allDocs.length);
        
        if (sectionTitle) sectionTitle.textContent = this.currentChapter.titulo;
        if (sectionCode) sectionCode.textContent = this.currentChapter.codigo;
        if (documentCount) documentCount.textContent = `${allDocs.length} documento${allDocs.length !== 1 ? 's' : ''}`;
        
        if (allDocs.length === 0) {
            documentsGrid.innerHTML = `
                <div class="no-documents">
                    <div class="no-documents-icon">📁</div>
                    <h3>No hay documentos</h3>
                    <p>Esta sección no contiene documentos aún.</p>
                    <button class="btn-primary" onclick="portal.showUpload()">
                        <span class="btn-icon">➕</span>
                        <span class="btn-text">Añadir Primer Documento</span>
                    </button>
                </div>
            `;
            return;
        }
        
        documentsGrid.innerHTML = allDocs.map(doc => this.createDocumentCard(doc)).join('');
        console.log('✅ Documentos renderizados');
    }

    createDocumentCard(doc) {
        const isUploaded = doc.id && doc.id.startsWith('uploaded_');
        const status = (doc.estado || 'Aprobado').toLowerCase();
        const ext = this.getFileExtension(doc.ruta || doc.fileName);
        const tags = doc.tags || [];
        
        return `
            <div class="document-card">
                <div class="document-header">
                    <div class="document-title">${doc.titulo}</div>
                    <div class="document-status ${status}">${doc.estado || 'Aprobado'}</div>
                </div>
                <div class="document-meta">
                    <div class="document-date">
                        <span>📅</span>
                        <span>${this.formatDate(doc.fecha || doc.uploadDate)}</span>
                    </div>
                    <div class="document-type">${ext.toUpperCase()}</div>
                    ${isUploaded ? '<div class="uploaded-badge">📤 Subido</div>' : ''}
                </div>
                ${tags.length > 0 ? `
                    <div class="document-tags">
                        ${tags.map(tag => `<span class="document-tag">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="document-actions">
                    <button class="btn-primary" onclick="portal.viewDocument('${doc.id || 'manifest_' + doc.titulo}')">
                        <span class="btn-icon">👁️</span>
                        <span class="btn-text">Ver Documento</span>
                    </button>
                    ${isUploaded ? `
                        <button class="btn-secondary" onclick="portal.deleteDocument('${doc.id}')" title="Eliminar">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getFileExtension(fileName) {
        return fileName ? fileName.split('.').pop().toLowerCase() : 'html';
    }

    formatDate(dateString) {
        if (!dateString) return 'Sin fecha';
        return new Date(dateString).toLocaleDateString('es-ES');
    }

    searchDocuments(term) {
        console.log('🔍 Buscando:', term);
        // Implementar busca simples
    }

    // Upload
    showUpload() {
        console.log('📤 Mostrando modal de upload');
        const modal = document.getElementById('uploadModal');
        console.log('Modal encontrado:', modal);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            console.log('✅ Modal de upload mostrado');
        } else {
            console.error('❌ Modal de upload não encontrado!');
        }
    }

    hideUpload() {
        console.log('❌ Escondendo modal de upload');
        const modal = document.getElementById('uploadModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
            this.resetUploadForm();
        }
    }

    resetUploadForm() {
        const form = document.getElementById('uploadForm');
        if (form) form.reset();
        this.removeSelectedFile();
    }

    handleFile(file) {
        if (!file) return;
        
        console.log('📁 Arquivo selecionado:', file.name);
        
        // Lista expandida de tipos de arquivo permitidos
        const allowed = [
            // Documentos
            '.html', '.htm', '.pdf', '.doc', '.docx', '.rtf', '.txt', '.md',
            // Planilhas
            '.xls', '.xlsx', '.csv', '.ods',
            // Apresentações
            '.ppt', '.pptx', '.odp',
            // Imagens
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.tiff',
            // Arquivos de texto
            '.xml', '.json', '.yaml', '.yml', '.ini', '.cfg', '.conf',
            // Arquivos de código
            '.js', '.css', '.php', '.py', '.java', '.cpp', '.c', '.h',
            // Arquivos compactados
            '.zip', '.rar', '.7z', '.tar', '.gz',
            // Outros
            '.dwg', '.dxf', '.cad', '.psd', '.ai', '.eps'
        ];
        
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowed.includes(ext)) {
            this.showToast(`Tipo de archivo no permitido: ${ext}\nTipos permitidos: ${allowed.slice(0, 10).join(', ')}...`, 'error');
            return;
        }
        
        if (file.size > 50 * 1024 * 1024) {
            this.showToast('Archivo demasiado grande (máximo 50MB)', 'error');
            return;
        }
        
        this.showFilePreview(file);
    }

    showFilePreview(file) {
        const preview = document.getElementById('filePreview');
        const placeholder = document.querySelector('.upload-placeholder');
        
        if (preview && placeholder) {
            const fileName = document.getElementById('fileName');
            const fileSize = document.getElementById('fileSize');
            const fileIcon = document.getElementById('fileIcon');
            
            if (fileName) fileName.textContent = file.name;
            if (fileSize) fileSize.textContent = this.formatFileSize(file.size);
            if (fileIcon) fileIcon.textContent = this.getFileIcon(file.name);
            
            placeholder.classList.add('hidden');
            preview.classList.remove('hidden');
        }
    }

    removeSelectedFile() {
        const preview = document.getElementById('filePreview');
        const placeholder = document.querySelector('.upload-placeholder');
        
        if (preview && placeholder) {
            preview.classList.add('hidden');
            placeholder.classList.remove('hidden');
        }
        
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFileIcon(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        const icons = {
            // Documentos
            'html': '🌐', 'htm': '🌐', 'pdf': '📄', 'doc': '📝', 'docx': '📝', 'rtf': '📄', 'txt': '📄', 'md': '📝',
            // Planilhas
            'xls': '📊', 'xlsx': '📊', 'csv': '📊', 'ods': '📊',
            // Apresentações
            'ppt': '📽️', 'pptx': '📽️', 'odp': '📽️',
            // Imagens
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'bmp': '🖼️', 'svg': '🖼️', 'webp': '🖼️', 'tiff': '🖼️',
            // Arquivos de texto/código
            'xml': '📄', 'json': '📄', 'yaml': '📄', 'yml': '📄', 'ini': '⚙️', 'cfg': '⚙️', 'conf': '⚙️',
            'js': '💻', 'css': '🎨', 'php': '💻', 'py': '🐍', 'java': '☕', 'cpp': '💻', 'c': '💻', 'h': '💻',
            // Arquivos compactados
            'zip': '📦', 'rar': '📦', '7z': '📦', 'tar': '📦', 'gz': '📦',
            // CAD e Design
            'dwg': '📐', 'dxf': '📐', 'cad': '📐', 'psd': '🎨', 'ai': '🎨', 'eps': '🎨'
        };
        return icons[ext] || '📄';
    }

    async handleUpload() {
        console.log('📤 Processando upload...');
        
        const title = document.getElementById('documentTitle');
        const chapter = document.getElementById('documentChapter');
        const tags = document.getElementById('documentTags');
        const fileInput = document.getElementById('fileInput');
        
        if (!title || !chapter || !fileInput) {
            this.showToast('Elementos do formulário não encontrados', 'error');
            return;
        }
        
        const titleValue = title.value.trim();
        const chapterValue = chapter.value;
        const tagsValue = tags ? tags.value.trim() : '';
        const file = fileInput.files[0];

        if (!titleValue || !chapterValue || !file) {
            this.showToast('Complete todos los campos', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            const doc = {
                id: 'uploaded_' + Date.now(),
                titulo: titleValue,
                chapter: chapterValue,
                tags: tagsValue ? tagsValue.split(',').map(t => t.trim()) : [],
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                uploadDate: new Date().toISOString(),
                estado: 'Aprobado',
                fileData: await this.fileToBase64(file)
            };

            this.uploadedDocuments.push(doc);
            this.saveUploadedDocuments();
            this.showToast('Documento subido correctamente', 'success');
            this.hideUpload();
            this.updateStats();

            if (this.currentChapter && this.currentChapter.codigo === chapterValue) {
                this.renderDocuments();
            }
            
            console.log('✅ Upload concluído');
        } catch (error) {
            console.error('❌ Erro no upload:', error);
            this.showToast('Error al subir', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Viewer
    viewDocument(docId) {
        console.log('👁️ Visualizando documento:', docId);
        
        let doc = null;
        
        if (docId.startsWith('uploaded_')) {
            doc = this.uploadedDocuments.find(d => d.id === docId);
        } else {
            const manifestId = docId.replace('manifest_', '');
            if (this.currentChapter) {
                doc = this.currentChapter.items.find(d => d.titulo === manifestId);
            }
        }

        if (!doc) {
            this.showToast('Documento no encontrado', 'error');
            return;
        }

        this.currentDocument = doc;
        this.showViewerModal();
    }

    showViewerModal() {
        const modal = document.getElementById('viewerModal');
        const title = document.getElementById('viewerTitle');
        const frame = document.getElementById('documentFrame');

        if (modal && title && frame) {
            title.textContent = this.currentDocument.titulo;
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';

            const fileExt = this.getFileExtension(this.currentDocument.fileName || this.currentDocument.ruta);
            
            // Para imagens, mostrar diretamente
            if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff'].includes(fileExt)) {
                if (this.currentDocument.fileData) {
                    frame.src = this.currentDocument.fileData;
                } else if (this.currentDocument.ruta) {
                    frame.src = this.currentDocument.ruta;
                }
            }
            // Para HTML, mostrar no iframe
            else if (['html', 'htm'].includes(fileExt)) {
                if (this.currentDocument.fileData) {
                    frame.src = this.currentDocument.fileData;
                } else if (this.currentDocument.ruta) {
                    frame.src = this.currentDocument.ruta;
                }
            }
            // Para outros tipos, mostrar mensagem informativa
            else {
                frame.src = 'about:blank';
                frame.onload = () => {
                    frame.contentDocument.body.innerHTML = `
                        <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
                            <h2>📄 ${this.currentDocument.titulo}</h2>
                            <p><strong>Tipo de archivo:</strong> ${fileExt.toUpperCase()}</p>
                            <p><strong>Tamaño:</strong> ${this.formatFileSize(this.currentDocument.fileSize || 0)}</p>
                            <p>Este tipo de archivo no se puede visualizar directamente en el navegador.</p>
                            <p>Use el botón "Descargar" para abrir el archivo con la aplicación apropiada.</p>
                            <div style="margin-top: 20px;">
                                <button onclick="portal.downloadDoc()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                                    📥 Descargar Archivo
                                </button>
                                <button onclick="portal.printDoc()" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                                    🖨️ Imprimir
                                </button>
                            </div>
                        </div>
                    `;
                };
            }
        }
    }

    hideViewer() {
        const modal = document.getElementById('viewerModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
            this.currentDocument = null;
        }
    }

    printDoc() {
        if (!this.currentDocument) return;
        const frame = document.getElementById('documentFrame');
        if (frame && frame.contentWindow) {
            frame.contentWindow.print();
        }
    }

    downloadDoc() {
        if (!this.currentDocument) return;
        
        if (this.currentDocument.fileData) {
            const link = document.createElement('a');
            link.href = this.currentDocument.fileData;
            link.download = this.currentDocument.fileName;
            link.click();
        } else if (this.currentDocument.ruta) {
            const link = document.createElement('a');
            link.href = this.currentDocument.ruta;
            link.download = this.currentDocument.titulo + '.html';
            link.click();
        }
    }

    deleteDocument(docId) {
        // Encontrar o documento
        const doc = this.uploadedDocuments.find(d => d.id === docId);
        if (!doc) {
            this.showToast('Documento não encontrado', 'error');
            return;
        }

        // Confirmação mais detalhada
        const confirmMessage = `Tem certeza que quer eliminar este documento?\n\n` +
                              `Título: ${doc.titulo}\n` +
                              `Capítulo: ${doc.chapter}\n` +
                              `Data: ${this.formatDate(doc.uploadDate)}\n\n` +
                              `Esta ação é IRREVERSÍVEL!`;
        
        if (!confirm(confirmMessage)) {
            console.log('❌ Eliminação cancelada pelo utilizador');
            return;
        }
        
        try {
            const index = this.uploadedDocuments.findIndex(d => d.id === docId);
            if (index !== -1) {
                this.uploadedDocuments.splice(index, 1);
                this.saveUploadedDocuments();
                this.showToast(`Documento "${doc.titulo}" eliminado permanentemente!`, 'success');
                this.updateStats();
                
                // Recarregar a vista atual
                if (this.currentChapter) {
                    this.renderDocuments();
                }
                
                console.log('✅ Documento eliminado:', doc.titulo);
            }
        } catch (error) {
            console.error('❌ Erro ao eliminar documento:', error);
            this.showToast('Erro ao eliminar documento: ' + error.message, 'error');
        }
    }

    // Método para eliminar todos os documentos subidos
    clearAllUploadedDocuments() {
        if (this.uploadedDocuments.length === 0) {
            this.showToast('Não há documentos subidos para eliminar', 'info');
            return;
        }

        const confirmMessage = `ATENÇÃO: Esta ação irá eliminar TODOS os ${this.uploadedDocuments.length} documento(s) subido(s)!\n\n` +
                              `Documentos do sistema (manifest) NÃO serão afetados.\n\n` +
                              `Esta ação é IRREVERSÍVEL!\n\n` +
                              `Tem certeza que quer continuar?`;
        
        if (!confirm(confirmMessage)) {
            console.log('❌ Limpeza cancelada pelo utilizador');
            return;
        }

        try {
            const deletedCount = this.uploadedDocuments.length;
            this.uploadedDocuments = [];
            this.saveUploadedDocuments();
            this.showToast(`${deletedCount} documentos eliminados permanentemente!`, 'success');
            this.updateStats();
            
            // Recarregar a vista atual
            if (this.currentChapter) {
                this.renderDocuments();
            }
            
            console.log('✅ Todos os documentos subidos eliminados');
        } catch (error) {
            console.error('❌ Erro ao limpar documentos:', error);
            this.showToast('Erro ao limpar documentos: ' + error.message, 'error');
        }
    }

    // Storage
    saveUploadedDocuments() {
        localStorage.setItem('uploadedDocuments', JSON.stringify(this.uploadedDocuments));
    }

    loadUploadedDocuments() {
        try {
            const saved = localStorage.getItem('uploadedDocuments');
            if (saved) {
                this.uploadedDocuments = JSON.parse(saved);
                console.log('📁 Documentos carregados:', this.uploadedDocuments.length);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar:', error);
            this.uploadedDocuments = [];
        }
    }

    updateStats() {
        const total = this.getTotalDocumentCount();
        const uploaded = this.uploadedDocuments.length;
        const recent = this.getRecentDocumentCount();

        const totalDocuments = document.getElementById('totalDocuments');
        const uploadedDocuments = document.getElementById('uploadedDocuments');
        const recentDocuments = document.getElementById('recentDocuments');
        const totalDocs = document.getElementById('totalDocs');
        const uploadedDocs = document.getElementById('uploadedDocs');

        if (totalDocuments) totalDocuments.textContent = total;
        if (uploadedDocuments) uploadedDocuments.textContent = uploaded;
        if (recentDocuments) recentDocuments.textContent = recent;
        if (totalDocs) totalDocs.textContent = total;
        if (uploadedDocs) uploadedDocs.textContent = uploaded;

        // Atualizar lista de documentos recentes
        this.updateRecentDocumentsList();
    }

    updateRecentDocumentsList() {
        const recentDocsList = document.getElementById('recentDocsList');
        if (!recentDocsList) return;

        if (this.uploadedDocuments.length === 0) {
            recentDocsList.innerHTML = '<p class="text-muted">No hay documentos subidos recientemente</p>';
            return;
        }

        // Ordenar por data (mais recentes primeiro) e pegar os últimos 5
        const recentDocs = this.uploadedDocuments
            .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
            .slice(0, 5);

        recentDocsList.innerHTML = recentDocs.map(doc => `
            <div class="recent-doc-item">
                <div class="recent-doc-info">
                    <div class="recent-doc-title">${doc.titulo}</div>
                    <div class="recent-doc-meta">${doc.chapter} • ${this.formatDate(doc.uploadDate)} • ${this.getFileIcon(doc.fileName)}</div>
                </div>
                <div class="recent-doc-actions">
                    <button onclick="portal.viewDocument('${doc.id}')" title="Ver">👁️</button>
                    <button onclick="portal.deleteDocument('${doc.id}')" title="Eliminar">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    getTotalDocumentCount() {
        let count = 0;
        if (this.manifest) {
            this.manifest.secciones.forEach(section => {
                count += (section.items || []).length;
            });
        }
        return count + this.uploadedDocuments.length;
    }

    getRecentDocumentCount() {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return this.uploadedDocuments.filter(doc => new Date(doc.uploadDate) > weekAgo).length;
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            if (show) {
                spinner.classList.remove('hidden');
            } else {
                spinner.classList.add('hidden');
            }
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close">✕</button>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => toast.remove());
        }
        
        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 5000);
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM carregado, inicializando portal...');
    window.portal = new PortalCalidad();
});