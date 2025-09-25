// Portal de Calidad - Sistema Simples e Funcional
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
        const response = await fetch('data/manifest.json');
        this.manifest = await response.json();
        console.log('📋 Manifest carregado:', this.manifest.secciones.length, 'capítulos');
    }

    setupEvents() {
        // Busca
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchDocuments(e.target.value);
        });

        // Botões
        document.getElementById('uploadBtn').addEventListener('click', () => this.showUpload());
        document.getElementById('dashboardBtn').addEventListener('click', () => this.showDashboard());
        document.getElementById('addDocumentBtn').addEventListener('click', () => this.showUpload());

        // Upload
        document.getElementById('closeUploadModal').addEventListener('click', () => this.hideUpload());
        document.getElementById('cancelUpload').addEventListener('click', () => this.hideUpload());
        document.getElementById('uploadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUpload();
        });

        // Arquivo
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFile(e.target.files[0]);
        });

        document.getElementById('selectFileBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        // Viewer
        document.getElementById('closeViewerModal').addEventListener('click', () => this.hideViewer());
        document.getElementById('printBtn').addEventListener('click', () => this.printDoc());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadDoc());

        // Drag & Drop
        const uploadArea = document.getElementById('fileUploadArea');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files[0]) this.handleFile(e.dataTransfer.files[0]);
        });
    }

    renderChapters() {
        const list = document.getElementById('chaptersList');
        list.innerHTML = '';
        
        this.manifest.secciones.forEach(section => {
            const div = document.createElement('div');
            div.className = 'chapter-item';
            div.dataset.chapter = section.codigo;
            
            const count = (section.items || []).length + this.getUploadedCount(section.codigo);
            
            div.innerHTML = `
                <div class="chapter-header">
                    <span class="chapter-code">${section.codigo}</span>
                    <span class="chapter-count-badge">${count}</span>
                </div>
                <div class="chapter-title">${section.titulo}</div>
            `;
            
            div.addEventListener('click', () => this.selectChapter(section));
            list.appendChild(div);
        });
        
        this.populateSelect();
    }

    getUploadedCount(chapterCode) {
        return this.uploadedDocuments.filter(doc => doc.chapter === chapterCode).length;
    }

    populateSelect() {
        const select = document.getElementById('documentChapter');
        select.innerHTML = '<option value="">Seleccionar capítulo...</option>';
        this.manifest.secciones.forEach(section => {
            const option = document.createElement('option');
            option.value = section.codigo;
            option.textContent = `${section.codigo} - ${section.titulo}`;
            select.appendChild(option);
        });
    }

    selectChapter(section) {
        document.querySelectorAll('.chapter-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-chapter="${section.codigo}"]`).classList.add('active');
        
        this.currentChapter = section;
        this.showDocuments();
        this.updateBreadcrumb(section);
        this.renderDocuments();
    }

    showDocuments() {
        document.getElementById('welcomeSection').classList.add('hidden');
        document.getElementById('documentsSection').classList.remove('hidden');
    }

    showDashboard() {
        document.getElementById('welcomeSection').classList.remove('hidden');
        document.getElementById('documentsSection').classList.add('hidden');
        document.querySelectorAll('.chapter-item').forEach(item => item.classList.remove('active'));
        this.updateStats();
    }

    updateBreadcrumb(section) {
        document.getElementById('breadcrumb').innerHTML = `
            <span class="breadcrumb-item">Inicio</span>
            <span class="breadcrumb-item active">${section.codigo} - ${section.titulo}</span>
        `;
    }

    renderDocuments() {
        if (!this.currentChapter) return;
        
        const grid = document.getElementById('documentsGrid');
        const title = document.getElementById('sectionTitle');
        const code = document.getElementById('sectionCode');
        const count = document.getElementById('documentCount');
        
        const manifestDocs = this.currentChapter.items || [];
        const uploadedDocs = this.uploadedDocuments.filter(doc => doc.chapter === this.currentChapter.codigo);
        const allDocs = [...manifestDocs, ...uploadedDocs];
        
        title.textContent = this.currentChapter.titulo;
        code.textContent = this.currentChapter.codigo;
        count.textContent = `${allDocs.length} documento${allDocs.length !== 1 ? 's' : ''}`;
        
        if (allDocs.length === 0) {
            grid.innerHTML = `
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
        
        grid.innerHTML = allDocs.map(doc => this.createCard(doc)).join('');
    }

    createCard(doc) {
        const isUploaded = doc.id && doc.id.startsWith('uploaded_');
        const status = (doc.estado || 'Aprobado').toLowerCase();
        const ext = this.getExtension(doc.ruta || doc.fileName);
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
                    <button class="btn-primary" onclick="portal.viewDoc('${doc.id || 'manifest_' + doc.titulo}')">
                        <span class="btn-icon">👁️</span>
                        <span class="btn-text">Ver Documento</span>
                    </button>
                    ${isUploaded ? `
                        <button class="btn-secondary" onclick="portal.deleteDoc('${doc.id}')" title="Eliminar">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getExtension(fileName) {
        return fileName ? fileName.split('.').pop().toLowerCase() : 'html';
    }

    formatDate(dateString) {
        if (!dateString) return 'Sin fecha';
        return new Date(dateString).toLocaleDateString('es-ES');
    }

    searchDocuments(term) {
        // Implementar busca simples
        console.log('Buscando:', term);
    }

    // Upload
    showUpload() {
        document.getElementById('uploadModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    hideUpload() {
        document.getElementById('uploadModal').classList.add('hidden');
        document.body.style.overflow = '';
        this.resetForm();
    }

    resetForm() {
        document.getElementById('uploadForm').reset();
        this.removeFile();
    }

    handleFile(file) {
        if (!file) return;
        
        const allowed = ['.html', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowed.includes(ext)) {
            this.showToast('Tipo de archivo no permitido', 'error');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            this.showToast('Archivo demasiado grande (máximo 10MB)', 'error');
            return;
        }
        
        this.showPreview(file);
    }

    showPreview(file) {
        const preview = document.getElementById('filePreview');
        const placeholder = document.querySelector('.upload-placeholder');
        
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = this.formatSize(file.size);
        document.getElementById('fileIcon').textContent = this.getIcon(file.name);
        
        placeholder.classList.add('hidden');
        preview.classList.remove('hidden');
    }

    removeFile() {
        document.getElementById('filePreview').classList.add('hidden');
        document.querySelector('.upload-placeholder').classList.remove('hidden');
        document.getElementById('fileInput').value = '';
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getIcon(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        const icons = {
            'html': '🌐', 'pdf': '📄', 'doc': '📝', 'docx': '📝',
            'xls': '📊', 'xlsx': '📊', 'txt': '📄'
        };
        return icons[ext] || '📄';
    }

    async handleUpload() {
        const title = document.getElementById('documentTitle').value.trim();
        const chapter = document.getElementById('documentChapter').value;
        const tags = document.getElementById('documentTags').value.trim();
        const file = document.getElementById('fileInput').files[0];

        if (!title || !chapter || !file) {
            this.showToast('Complete todos los campos', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            const doc = {
                id: 'uploaded_' + Date.now(),
                titulo: title,
                chapter: chapter,
                tags: tags ? tags.split(',').map(t => t.trim()) : [],
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                uploadDate: new Date().toISOString(),
                estado: 'Aprobado',
                fileData: await this.toBase64(file)
            };

            this.uploadedDocuments.push(doc);
            this.saveDocuments();
            this.showToast('Documento subido correctamente', 'success');
            this.hideUpload();
            this.updateStats();

            if (this.currentChapter && this.currentChapter.codigo === chapter) {
                this.renderDocuments();
            }
        } catch (error) {
            console.error('❌ Erro:', error);
            this.showToast('Error al subir', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Viewer
    viewDoc(docId) {
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

        this.currentDoc = doc;
        this.showViewer();
    }

    showViewer() {
        const modal = document.getElementById('viewerModal');
        const title = document.getElementById('viewerTitle');
        const frame = document.getElementById('documentFrame');

        title.textContent = this.currentDoc.titulo;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        if (this.currentDoc.fileData) {
            frame.src = this.currentDoc.fileData;
        } else if (this.currentDoc.ruta) {
            frame.src = this.currentDoc.ruta;
        }
    }

    hideViewer() {
        document.getElementById('viewerModal').classList.add('hidden');
        document.body.style.overflow = '';
        this.currentDoc = null;
    }

    printDoc() {
        if (!this.currentDoc) return;
        const frame = document.getElementById('documentFrame');
        if (frame.contentWindow) frame.contentWindow.print();
    }

    downloadDoc() {
        if (!this.currentDoc) return;
        
        if (this.currentDoc.fileData) {
            const link = document.createElement('a');
            link.href = this.currentDoc.fileData;
            link.download = this.currentDoc.fileName;
            link.click();
        } else if (this.currentDoc.ruta) {
            const link = document.createElement('a');
            link.href = this.currentDoc.ruta;
            link.download = this.currentDoc.titulo + '.html';
            link.click();
        }
    }

    deleteDoc(docId) {
        if (!confirm('¿Eliminar documento?')) return;
        
        const index = this.uploadedDocuments.findIndex(doc => doc.id === docId);
        if (index !== -1) {
            this.uploadedDocuments.splice(index, 1);
            this.saveDocuments();
            this.showToast('Documento eliminado', 'success');
            this.updateStats();
            if (this.currentChapter) this.renderDocuments();
        }
    }

    // Storage
    saveDocuments() {
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
        const total = this.getTotalCount();
        const uploaded = this.uploadedDocuments.length;
        const recent = this.getRecentCount();

        document.getElementById('totalDocuments').textContent = total;
        document.getElementById('uploadedDocuments').textContent = uploaded;
        document.getElementById('recentDocuments').textContent = recent;
        document.getElementById('totalDocs').textContent = total;
        document.getElementById('uploadedDocs').textContent = uploaded;
    }

    getTotalCount() {
        let count = 0;
        if (this.manifest) {
            this.manifest.secciones.forEach(section => {
                count += (section.items || []).length;
            });
        }
        return count + this.uploadedDocuments.length;
    }

    getRecentCount() {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return this.uploadedDocuments.filter(doc => new Date(doc.uploadDate) > weekAgo).length;
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close">✕</button>
        `;

        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 5000);
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    window.portal = new PortalCalidad();
});
