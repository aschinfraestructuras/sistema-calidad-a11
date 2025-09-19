// Portal de Calidad ASCH - Aplicación Principal
class PortalCalidad {
    constructor() {
        this.manifest = null;
        this.currentChapter = null;
        this.currentView = 'grid';
        this.currentFilters = {
            status: '',
            date: '',
            search: ''
        };
        this.theme = localStorage.getItem('theme') || 'dark';
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setTheme(this.theme);
        await this.loadManifest();
        this.renderChapters();
        this.updateStats();
        this.showWelcomeMessage();
    }

    setupEventListeners() {
        // Búsqueda
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value.toLowerCase();
            this.filterDocuments();
        });

        document.getElementById('searchBtn').addEventListener('click', () => {
            this.filterDocuments();
        });

        // Filtros
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            this.filterDocuments();
        });

        document.getElementById('dateFilter').addEventListener('change', (e) => {
            this.currentFilters.date = e.target.value;
            this.filterDocuments();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Vista
        document.getElementById('gridView').addEventListener('click', () => {
            this.setView('grid');
        });

        document.getElementById('listView').addEventListener('click', () => {
            this.setView('list');
        });

        // Tema
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Modal
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('downloadDoc').addEventListener('click', () => {
            this.downloadDocument();
        });

        document.getElementById('printDoc').addEventListener('click', () => {
            this.printDocument();
        });

        // Reset búsqueda
        document.getElementById('resetSearch').addEventListener('click', () => {
            this.clearFilters();
        });

        // Cerrar modal con overlay
        document.getElementById('documentModal').addEventListener('click', (e) => {
            if (e.target.id === 'documentModal' || e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });

        // Teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
            if (e.key === 'Enter' && e.target.id === 'searchInput') {
                this.filterDocuments();
            }
        });
    }

    async loadManifest() {
        try {
            this.showLoading(true);
            const response = await fetch('data/manifest.json');
            if (!response.ok) {
                throw new Error('Error al cargar el manifest');
            }
            this.manifest = await response.json();
            this.showLoading(false);
        } catch (error) {
            console.error('Error cargando manifest:', error);
            this.showToast('Error al cargar los documentos', 'error');
            this.showLoading(false);
        }
    }

    renderChapters() {
        if (!this.manifest) return;

        const chaptersList = document.getElementById('chaptersList');
        chaptersList.innerHTML = '';

        this.manifest.secciones.forEach(section => {
            const chapterElement = this.createChapterElement(section);
            chaptersList.appendChild(chapterElement);
        });
    }

    createChapterElement(section) {
        const chapterDiv = document.createElement('div');
        chapterDiv.className = 'chapter-item';
        chapterDiv.dataset.chapter = section.codigo;

        const totalDocs = section.items ? section.items.length : 0;
        const activeDocs = section.items ? section.items.filter(doc => doc.estado !== 'Obsoleto').length : 0;

        chapterDiv.innerHTML = `
            <div class="chapter-header">
                <span class="chapter-code">${section.codigo}</span>
                <span class="chapter-count-badge">${totalDocs}</span>
            </div>
            <div class="chapter-title">${section.titulo}</div>
            <div class="chapter-description">${this.getChapterDescription(section.codigo)}</div>
        `;

        chapterDiv.addEventListener('click', () => {
            this.selectChapter(section);
        });

        return chapterDiv;
    }

    getChapterDescription(codigo) {
        const descriptions = {
            '01': 'Plan de Aseguramiento de la Calidad',
            '02': 'Plan de Ensayos y Controles',
            '03': 'Objetivos y Política de Calidad',
            '04': 'Programación y Comunicaciones',
            '05': 'Trazabilidad de Materiales',
            '06': 'Puntos de Inspección y Control',
            '07': 'Equipos, Maquinaria y Tajos',
            '08': 'Calibración de Equipos',
            '09': 'Certificados y Materiales',
            '10': 'No Conformidades y Acciones',
            '11': 'Control de Calidad y Asistencia',
            '12': 'Cálculos y Notas Técnicas',
            '13': 'Control Geométrico',
            '14': 'Control de Planos',
            '15': 'Laboratorio y Ensayos',
            '16': 'Documentación General',
            '17': 'Control Económico de Calidad',
            '18': 'Normativas y Reglamentos',
            '19': 'Pruebas Finales',
            '20': 'Auditorías de Calidad',
            '21': 'Informes Mensuales'
        };
        return descriptions[codigo] || 'Documentos de calidad';
    }

    selectChapter(section) {
        // Actualizar UI
        document.querySelectorAll('.chapter-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-chapter="${section.codigo}"]`).classList.add('active');

        // Actualizar breadcrumb
        this.updateBreadcrumb(section);

        // Mostrar documentos
        this.currentChapter = section;
        this.renderDocuments(section.items || []);

        // Ocultar mensaje de bienvenida
        document.getElementById('welcomeMessage').classList.add('hidden');
        document.getElementById('documentsContainer').classList.remove('hidden');
        document.getElementById('noResults').classList.add('hidden');
    }

    updateBreadcrumb(section) {
        const breadcrumb = document.getElementById('breadcrumb');
        breadcrumb.innerHTML = `
            <span class="breadcrumb-item">Inicio</span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-item active">${section.codigo} - ${section.titulo}</span>
        `;
    }

    renderDocuments(documents) {
        const container = document.getElementById('documentsList');
        const sectionTitle = document.getElementById('sectionTitle');
        const sectionCode = document.getElementById('sectionCode');
        const docCount = document.getElementById('docCount');

        if (!documents || documents.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-content">
                        <span class="no-results-icon">📁</span>
                        <h3>No hay documentos</h3>
                        <p>Esta sección no contiene documentos aún.</p>
                    </div>
                </div>
            `;
            sectionTitle.textContent = 'Sin documentos';
            sectionCode.textContent = '';
            docCount.textContent = '0 documentos';
            return;
        }

        sectionTitle.textContent = this.currentChapter.titulo;
        sectionCode.textContent = this.currentChapter.codigo;
        docCount.textContent = `${documents.length} documento${documents.length !== 1 ? 's' : ''}`;

        container.innerHTML = documents.map(doc => this.createDocumentCard(doc)).join('');
    }

    createDocumentCard(document) {
        const statusClass = document.estado ? document.estado.toLowerCase() : 'aprobado';
        const statusText = document.estado || 'Aprobado';
        const fileExtension = this.getFileExtension(document.ruta);
        const tags = document.tags || [];

        return `
            <div class="document-card" data-document='${JSON.stringify(document)}'>
                <div class="document-header">
                    <div class="document-title">${document.titulo}</div>
                    <span class="document-status ${statusClass}">${statusText}</span>
                </div>
                
                <div class="document-meta">
                    <div class="document-date">
                        <span>📅</span>
                        <span>${this.formatDate(document.fecha)}</span>
                    </div>
                    <div class="document-type">${fileExtension.toUpperCase()}</div>
                </div>
                
                ${tags.length > 0 ? `
                    <div class="document-tags">
                        ${tags.map(tag => `<span class="document-tag">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="document-actions">
                    <span class="document-type">${fileExtension}</span>
                    <button class="open-btn" onclick="portal.openDocument('${document.ruta}')">
                        Abrir Documento
                    </button>
                </div>
            </div>
        `;
    }

    getFileExtension(path) {
        return path.split('.').pop() || 'html';
    }

    formatDate(dateString) {
        if (!dateString) return 'Sin fecha';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    filterDocuments() {
        if (!this.currentChapter) return;

        let filteredDocs = this.currentChapter.items || [];

        // Filtro por búsqueda
        if (this.currentFilters.search) {
            filteredDocs = filteredDocs.filter(doc => {
                const searchText = this.currentFilters.search;
                return doc.titulo.toLowerCase().includes(searchText) ||
                       (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchText)));
            });
        }

        // Filtro por estado
        if (this.currentFilters.status) {
            filteredDocs = filteredDocs.filter(doc => doc.estado === this.currentFilters.status);
        }

        // Filtro por fecha
        if (this.currentFilters.date) {
            const now = new Date();
            filteredDocs = filteredDocs.filter(doc => {
                const docDate = new Date(doc.fecha);
                switch (this.currentFilters.date) {
                    case 'today':
                        return docDate.toDateString() === now.toDateString();
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return docDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        return docDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        this.renderDocuments(filteredDocs);

        // Mostrar mensaje si no hay resultados
        if (filteredDocs.length === 0) {
            document.getElementById('documentsContainer').classList.add('hidden');
            document.getElementById('noResults').classList.remove('hidden');
        } else {
            document.getElementById('documentsContainer').classList.remove('hidden');
            document.getElementById('noResults').classList.add('hidden');
        }
    }

    clearFilters() {
        this.currentFilters = { status: '', date: '', search: '' };
        document.getElementById('searchInput').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('dateFilter').value = '';
        
        if (this.currentChapter) {
            this.filterDocuments();
        }
    }

    setView(view) {
        this.currentView = view;
        const container = document.getElementById('documentsList');
        const gridBtn = document.getElementById('gridView');
        const listBtn = document.getElementById('listView');

        if (view === 'grid') {
            container.className = 'documents-list grid-view';
            gridBtn.classList.add('active');
            listBtn.classList.remove('active');
        } else {
            container.className = 'documents-list list-view';
            listBtn.classList.add('active');
            gridBtn.classList.remove('active');
        }
    }

    openDocument(path) {
        const modal = document.getElementById('documentModal');
        const frame = document.getElementById('documentFrame');
        const title = document.getElementById('modalTitle');

        // Obtener título del documento actual
        const currentDoc = this.currentChapter.items.find(doc => doc.ruta === path);
        title.textContent = currentDoc ? currentDoc.titulo : 'Documento';

        // Cargar documento
        frame.src = path;
        modal.classList.remove('hidden');

        // Guardar referencia para descarga
        this.currentDocument = currentDoc;
    }

    closeModal() {
        const modal = document.getElementById('documentModal');
        const frame = document.getElementById('documentFrame');
        
        modal.classList.add('hidden');
        frame.src = '';
        this.currentDocument = null;
    }

    downloadDocument() {
        if (!this.currentDocument) return;

        const link = document.createElement('a');
        link.href = this.currentDocument.ruta;
        link.download = this.currentDocument.titulo;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showToast('Descarga iniciada', 'success');
    }

    printDocument() {
        const frame = document.getElementById('documentFrame');
        if (frame.contentWindow) {
            frame.contentWindow.print();
        }
    }

    setTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    toggleTheme() {
        const newTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    updateStats() {
        if (!this.manifest) return;

        let totalDocs = 0;
        let activeDocs = 0;

        this.manifest.secciones.forEach(section => {
            if (section.items) {
                totalDocs += section.items.length;
                activeDocs += section.items.filter(doc => doc.estado !== 'Obsoleto').length;
            }
        });

        document.getElementById('totalDocs').textContent = `${totalDocs} documentos`;
        document.getElementById('totalChapters').textContent = this.manifest.secciones.length;
        document.getElementById('activeDocs').textContent = activeDocs;
    }

    showWelcomeMessage() {
        document.getElementById('welcomeMessage').classList.remove('hidden');
        document.getElementById('documentsContainer').classList.add('hidden');
        document.getElementById('noResults').classList.add('hidden');
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
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>${this.getToastIcon(type)}</span>
                <span>${message}</span>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in-out forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.portal = new PortalCalidad();
});

// Agregar animación de salida para toasts
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
