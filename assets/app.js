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
        this.currentUser = null;
        this.isAuthenticated = false;
        this.selectedFiles = [];
        this.uploadedDocuments = JSON.parse(localStorage.getItem('uploadedDocuments') || '[]');
        this.currentChapterForUpload = null;
        this.selectedFileForChapter = null;
        this.db = null;
        this.dbName = 'PortalCalidadDB';
        this.dbVersion = 1;
        
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando Portal de Calidad...');
        console.log('🔧 CONFIG.auth.enabled:', CONFIG.auth.enabled);
        
        this.setupEventListeners();
        this.setTheme(this.theme);
        
        // Inicializar base de dados com retry
        let dbInitialized = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`📊 Tentativa ${attempt} de inicializar base de dados...`);
                await dbManager.init();
                console.log('✅ Base de dados inicializada com sucesso');
                dbInitialized = true;
                break;
            } catch (error) {
                console.error(`❌ Erro na tentativa ${attempt}:`, error);
                if (attempt === 3) {
                    console.error('💥 Falha crítica na base de dados, usando localStorage como fallback');
                    this.showToast('Usando armazenamento local como alternativa', 'warning');
                }
                await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1s
            }
        }
        
        // Verificar autenticación
        if (CONFIG.auth.enabled) {
            console.log('🔐 Autenticação ativada - verificando login...');
            this.checkAuthentication();
        } else {
            console.log('🔓 Autenticação desativada - carregando diretamente...');
            this.isAuthenticated = true;
            
            try {
                console.log('📋 Carregando manifest...');
                await this.loadManifest();
                console.log('✅ Manifest carregado:', this.manifest);
                
                console.log('📚 Renderizando capítulos...');
                this.renderChapters();
                
                console.log('📊 Atualizando estatísticas...');
                this.updateStats();
                
                console.log('👋 Mostrando mensagem de boas-vindas...');
                this.showWelcomeMessage();
                
                // Carregar documentos existentes
                setTimeout(() => {
                    console.log('📁 Carregando ficheiros subidos...');
                    this.loadUploadedFiles();
                }, 1000);
                
                console.log('✅ Inicialização completa!');
            } catch (error) {
                console.error('❌ Erro na inicialização:', error);
                this.showToast('Erro na inicialização: ' + error.message, 'error');
            }
        }
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

        // Login
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Upload Panel
        document.getElementById('uploadPanelBtn').addEventListener('click', () => {
            this.showUploadPanel();
        });

        document.getElementById('dashboardBtn').addEventListener('click', () => {
            this.showDashboard();
        });

        // File Upload
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        document.getElementById('uploadArea').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        // Drag and Drop
        document.getElementById('uploadArea').addEventListener('dragover', (e) => {
            e.preventDefault();
            e.currentTarget.classList.add('dragover');
        });

        document.getElementById('uploadArea').addEventListener('dragleave', (e) => {
            e.currentTarget.classList.remove('dragover');
        });

        document.getElementById('uploadArea').addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files);
        });

        // Upload Button
        document.getElementById('uploadBtn').addEventListener('click', () => {
            this.uploadDocuments();
        });

        // Form fields
        document.getElementById('documentTitle').addEventListener('input', () => {
            this.updateUploadButton();
        });

        // Add Document Modal
        document.getElementById('addDocumentBtn').addEventListener('click', () => {
            this.showAddDocumentModal();
        });

        document.getElementById('closeAddModal').addEventListener('click', () => {
            this.hideAddDocumentModal();
        });

        document.getElementById('cancelAddDocument').addEventListener('click', () => {
            this.hideAddDocumentModal();
        });

        // Chapter File Upload
        document.getElementById('chapterFileInput').addEventListener('change', (e) => {
            this.handleChapterFileSelect(e.target.files[0]);
        });

        document.getElementById('chapterFileUpload').addEventListener('click', () => {
            document.getElementById('chapterFileInput').click();
        });

        // Drag and Drop for Chapter Upload
        document.getElementById('chapterFileUpload').addEventListener('dragover', (e) => {
            e.preventDefault();
            e.currentTarget.classList.add('dragover');
        });

        document.getElementById('chapterFileUpload').addEventListener('dragleave', (e) => {
            e.currentTarget.classList.remove('dragover');
        });

        document.getElementById('chapterFileUpload').addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('dragover');
            this.handleChapterFileSelect(e.dataTransfer.files[0]);
        });

        // Save Document
        document.getElementById('saveDocument').addEventListener('click', () => {
            this.saveChapterDocument();
        });

        // Form validation
        document.getElementById('chapterDocumentTitle').addEventListener('input', () => {
            this.updateSaveButton();
        });

        // Cerrar modal con overlay
        document.getElementById('documentModal').addEventListener('click', (e) => {
            if (e.target.id === 'documentModal' || e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });

        // Cerrar modal de login
        document.getElementById('loginModal').addEventListener('click', (e) => {
            if (e.target.id === 'loginModal' || e.target.classList.contains('modal-overlay')) {
                // No permitir cerrar el modal de login sin autenticarse
                if (CONFIG.auth.enabled && !this.isAuthenticated) {
                    return;
                }
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
        console.log('📚 renderChapters chamado');
        console.log('📋 this.manifest:', this.manifest);
        
        if (!this.manifest) {
            console.error('❌ Manifest não carregado!');
            return;
        }

        const chaptersList = document.getElementById('chaptersList');
        if (!chaptersList) {
            console.error('❌ Elemento chaptersList não encontrado!');
            return;
        }
        
        console.log('📋 Seções encontradas:', this.manifest.secciones.length);
        chaptersList.innerHTML = '';

        this.manifest.secciones.forEach((section, index) => {
            console.log(`📖 Criando capítulo ${index + 1}:`, section.codigo, section.titulo);
            const chapterElement = this.createChapterElement(section);
            chaptersList.appendChild(chapterElement);
        });
        
        console.log('✅ Capítulos renderizados com sucesso');
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
            '01': 'Sistema de Gestión de Documentos',
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

    async selectChapter(section) {
        // Ocultar painel de upload se estiver aberto
        document.getElementById('uploadPanel').classList.add('hidden');
        
        // Remover classe active de todos os botões
        document.querySelectorAll('.chapter-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.sidebar-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Adicionar classe active ao capítulo selecionado
        document.querySelector(`[data-chapter="${section.codigo}"]`).classList.add('active');

        // Actualizar breadcrumb
        this.updateBreadcrumb(section);

        // Mostrar documentos
        this.currentChapter = section;
        await this.renderDocuments(section.items || []);

        // Ocultar mensaje de bienvenida e mostrar documentos
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

    async renderDocuments(documents) {
        const container = document.getElementById('documentsList');
        const sectionTitle = document.getElementById('sectionTitle');
        const sectionCode = document.getElementById('sectionCode');
        const docCount = document.getElementById('docCount');

        // Obter documentos subidos pelo utilizador para este capítulo
        let userDocuments = [];
        try {
            const storedDocs = JSON.parse(localStorage.getItem('storedDocuments') || '[]');
            userDocuments = storedDocs.filter(doc => doc.chapter === this.currentChapter.codigo);
            console.log(`📋 Documentos do utilizador no capítulo ${this.currentChapter.codigo}:`, userDocuments.length);
        } catch (error) {
            console.error('❌ Erro ao carregar documentos do utilizador:', error);
        }

        // Combinar documentos do manifest com documentos do utilizador
        const allDocuments = [...(documents || []), ...userDocuments];

        if (allDocuments.length === 0) {
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
        docCount.textContent = `${allDocuments.length} documento${allDocuments.length !== 1 ? 's' : ''}`;

        container.innerHTML = allDocuments.map(doc => this.createDocumentCard(doc)).join('');
    }

    createDocumentCard(document) {
        const statusClass = document.estado ? document.estado.toLowerCase() : 'aprobado';
        const statusText = document.estado || 'Aprobado';
        const fileExtension = this.getFileExtension(document.ruta);
        const tags = document.tags || [];
        
        // Verificar se é um documento subido pelo utilizador (tem ID)
        const isUserDocument = document.id && document.id.startsWith('doc_');
        
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
                    ${isUserDocument ? '<div class="user-document-badge">📤 Subido</div>' : ''}
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
                    ${isUserDocument ? `
                        <button class="delete-btn" onclick="window.portal && window.portal.deleteDocument('${document.id}')" title="Eliminar documento">
                            🗑️
                        </button>
                    ` : ''}
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
                const searchText = this.currentFilters.search.toLowerCase();
                
                // Buscar en título
                if (doc.titulo.toLowerCase().includes(searchText)) return true;
                
                // Buscar en tags
                if (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchText))) return true;
                
                // Buscar en ruta (PK, PI, etc.)
                if (doc.ruta.toLowerCase().includes(searchText)) return true;
                
                // Buscar por códigos específicos
                if (searchText.includes('pk') || searchText.includes('pi')) {
                    const codeMatch = doc.ruta.match(/(PK|PI)\s*(\d+[\+\-]?\d*)/i);
                    if (codeMatch && searchText.includes(codeMatch[0].toLowerCase())) return true;
                }
                
                return false;
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

        await this.renderDocuments(filteredDocs);

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
        let approvedDocs = 0;
        let draftDocs = 0;
        let obsoleteDocs = 0;
        let recentDocs = 0;

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        this.manifest.secciones.forEach(section => {
            if (section.items) {
                totalDocs += section.items.length;
                activeDocs += section.items.filter(doc => doc.estado !== 'Obsoleto').length;
                approvedDocs += section.items.filter(doc => doc.estado === 'Aprobado').length;
                draftDocs += section.items.filter(doc => doc.estado === 'Borrador').length;
                obsoleteDocs += section.items.filter(doc => doc.estado === 'Obsoleto').length;
                recentDocs += section.items.filter(doc => {
                    const docDate = new Date(doc.fecha);
                    return docDate >= weekAgo;
                }).length;
            }
        });

        document.getElementById('totalDocs').textContent = `${totalDocs} documentos`;
        document.getElementById('totalChapters').textContent = this.manifest.secciones.length;
        document.getElementById('activeDocs').textContent = activeDocs;

        // Atualizar estatísticas avançadas se existirem
        const advancedStats = document.getElementById('advancedStats');
        if (advancedStats) {
            advancedStats.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number">${approvedDocs}</div>
                    <div class="stat-label">Aprobados</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${draftDocs}</div>
                    <div class="stat-label">Borradores</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${recentDocs}</div>
                    <div class="stat-label">Esta semana</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${obsoleteDocs}</div>
                    <div class="stat-label">Obsoletos</div>
                </div>
            `;
        }
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

    // Métodos de autenticación
    checkAuthentication() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.isAuthenticated = true;
            this.hideLoginModal();
            this.initializeApp();
        } else {
            this.showLoginModal();
        }
    }

    showLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Função para gerar hash SHA-256 simples
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showToast('Por favor, complete todos los campos', 'error');
            return;
        }

        try {
            // Gerar hash da senha inserida
            const passwordHash = await this.hashPassword(password);
            
            // Verificar se o hash corresponde ao hash armazenado
            const user = CONFIG.auth.users.find(u => 
                u.username === username && u.passwordHash === passwordHash
            );
            
            if (user) {
                this.currentUser = user;
                this.isAuthenticated = true;
                localStorage.setItem('currentUser', JSON.stringify(user));
                localStorage.setItem('isAuthenticated', 'true');
                
                this.hideLoginModal();
                this.showToast(`Bienvenido, ${user.name}`, 'success');
                await this.initializeApp();
            } else {
                this.showToast('Usuario o contraseña incorrectos', 'error');
                document.getElementById('password').value = '';
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.showToast('Error en el sistema de autenticación', 'error');
        }
    }

    async initializeApp() {
        await this.loadManifest();
        this.renderChapters();
        this.updateStats();
        this.showWelcomeMessage();
        this.updateUserInfo();
    }

    updateUserInfo() {
        if (this.currentUser) {
            const headerActions = document.querySelector('.header-actions');
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `
                <span class="user-name">${this.currentUser.name}</span>
                <span class="user-role">${this.currentUser.role}</span>
                <button id="logoutBtn" class="logout-btn" title="Cerrar sesión">🚪</button>
            `;
            headerActions.appendChild(userInfo);

            document.getElementById('logoutBtn').addEventListener('click', () => {
                this.logout();
            });
        }
    }

    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('currentUser');
        this.showToast('Sesión cerrada', 'info');
        this.showLoginModal();
        
        // Limpiar UI
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            userInfo.remove();
        }
        
        // Limpiar contenido
        document.getElementById('chaptersList').innerHTML = '';
        document.getElementById('documentsList').innerHTML = '';
        this.showWelcomeMessage();
    }

    // Métodos de Upload
    showUploadPanel() {
        this.hideAllPanels();
        document.getElementById('uploadPanel').classList.remove('hidden');
        document.getElementById('uploadPanelBtn').classList.add('active');
        this.updateBreadcrumbUpload();
        this.loadUploadedFiles();
    }

    showDashboard() {
        this.hideAllPanels();
        document.getElementById('welcomeMessage').classList.remove('hidden');
        document.getElementById('dashboardBtn').classList.add('active');
        this.updateBreadcrumbDashboard();
    }

    hideAllPanels() {
        document.getElementById('uploadPanel').classList.add('hidden');
        document.getElementById('welcomeMessage').classList.add('hidden');
        document.getElementById('documentsContainer').classList.add('hidden');
        document.getElementById('noResults').classList.add('hidden');
        
        // Remove active class from all sidebar buttons
        document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.chapter-item').forEach(item => item.classList.remove('active'));
    }

    updateBreadcrumbUpload() {
        const breadcrumb = document.getElementById('breadcrumb');
        breadcrumb.innerHTML = `
            <span class="breadcrumb-item">Inicio</span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-item active">Gestión de Documentos</span>
        `;
    }

    updateBreadcrumbDashboard() {
        const breadcrumb = document.getElementById('breadcrumb');
        breadcrumb.innerHTML = `
            <span class="breadcrumb-item active">Dashboard</span>
        `;
    }

    handleFileSelect(files) {
        this.selectedFiles = Array.from(files);
        this.updateUploadButton();
        this.showSelectedFiles();
    }

    updateUploadButton() {
        const uploadBtn = document.getElementById('uploadBtn');
        const hasFiles = this.selectedFiles.length > 0;
        const hasTitle = document.getElementById('documentTitle').value.trim() !== '';
        
        uploadBtn.disabled = !hasFiles || !hasTitle;
    }

    showSelectedFiles() {
        const uploadArea = document.getElementById('uploadArea');
        if (this.selectedFiles.length > 0) {
            uploadArea.innerHTML = `
                <div class="selected-files">
                    <h4>Archivos seleccionados (${this.selectedFiles.length}):</h4>
                    ${this.selectedFiles.map(file => `
                        <div class="file-preview">
                            <span class="file-icon">${this.getFileIcon(file.type)}</span>
                            <span class="file-name">${file.name}</span>
                            <span class="file-size">${this.formatFileSize(file.size)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    getFileIcon(fileType) {
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word') || fileType.includes('document')) return '📝';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
        if (fileType.includes('html')) return '🌐';
        if (fileType.includes('text/plain')) return '📄';
        if (fileType.includes('rtf')) return '📄';
        return '📁';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async uploadDocuments() {
        if (this.selectedFiles.length === 0) {
            this.showToast('Por favor, selecciona al menos un archivo', 'warning');
            return;
        }

        const title = document.getElementById('documentTitle').value.trim();
        const chapter = document.getElementById('documentChapter').value;
        const tags = document.getElementById('documentTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const status = document.getElementById('documentStatus').value;

        if (!title) {
            this.showToast('Por favor, introduce un título para el documento', 'warning');
            return;
        }

        if (!chapter) {
            this.showToast('Por favor, selecciona un capítulo', 'warning');
            return;
        }

        try {
            this.showLoading(true);
            let successCount = 0;
            let errorCount = 0;
            
            for (const file of this.selectedFiles) {
                try {
                    console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);
                    
                    // Validar tipo de archivo
                    if (!this.isValidFileType(file)) {
                        this.showToast(`Tipo de archivo no soportado: ${file.name}`, 'error');
                        errorCount++;
                        continue;
                    }

                    if (!this.validateFileSize(file)) {
                        this.showToast(`Archivo demasiado grande: ${file.name} (máximo 50MB)`, 'error');
                        errorCount++;
                        continue;
                    }

                    // Guardar archivo en base de datos
                    const fileData = await this.saveFileToDB(file);
                    
                    // Crear documento
                    const documentData = {
                        title: title,
                        chapter: chapter,
                        tags: tags,
                        date: new Date().toISOString().split('T')[0],
                        status: status,
                        fileId: fileData.id,
                        originalName: file.name,
                        type: file.type,
                        size: file.size
                    };

                    // Guardar documento en base de dados
                    let docId;
                    try {
                        docId = await dbManager.saveDocument(documentData);
                        console.log('✅ Documento guardado na IndexedDB com ID:', docId);
                        
                        // Atualizar o fileId no arquivo
                        await dbManager.updateFile(fileData.id, { documentId: docId });
                    } catch (dbError) {
                        console.warn('⚠️ IndexedDB falhou, usando localStorage:', dbError);
                        
                        // Fallback para localStorage
                        docId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                        documentData.id = docId;
                        
                        const storedDocs = JSON.parse(localStorage.getItem('storedDocuments') || '[]');
                        storedDocs.push(documentData);
                        localStorage.setItem('storedDocuments', JSON.stringify(storedDocs));
                        
                        console.log('✅ Documento guardado no localStorage com ID:', docId);
                    }
                    
                    successCount++;
                    console.log('Document saved successfully:', docId);
                    
                } catch (fileError) {
                    console.error('Error processing file:', file.name, fileError);
                    this.showToast(`Error al procesar ${file.name}: ${fileError.message}`, 'error');
                    errorCount++;
                }
            }

            // Mostrar resumen
            if (successCount > 0) {
                this.showToast(`Se subieron ${successCount} documento(s) correctamente`, 'success');
            }
            if (errorCount > 0) {
                this.showToast(`${errorCount} archivo(s) tuvieron errores`, 'warning');
            }

            this.resetUploadForm();
            this.loadUploadedFiles();
            
        } catch (error) {
            console.error('Error uploading documents:', error);
            this.showToast('Error al subir los documentos: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    isValidFileType(file) {
        // Verificar se o ficheiro existe
        if (!file || !file.name) {
            console.error('❌ Ficheiro inválido ou sem nome');
            return false;
        }

        const validTypes = [
            'text/html',
            'text/plain',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/excel',
            'application/x-excel',
            'application/x-msexcel',
            'application/rtf'
        ];
        
        const validExtensions = ['.html', '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.txt', '.rtf'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        // Verificar extensão
        if (!validExtensions.includes(fileExtension)) {
            console.error('❌ Extensão não permitida:', fileExtension);
            return false;
        }
        
        // Verificar tipo MIME (se disponível)
        if (file.type && !validTypes.includes(file.type)) {
            console.warn('⚠️ Tipo MIME não reconhecido:', file.type, 'mas extensão válida:', fileExtension);
            // Permitir se a extensão for válida
        }
        
        console.log('✅ Ficheiro válido:', file.name, 'Tipo:', file.type, 'Extensão:', fileExtension);
        return true;
    }

    validateFileSize(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            console.error('❌ Ficheiro muito grande:', file.size, 'bytes');
            return false;
        }
        return true;
    }

    async saveFileToDB(file) {
        return new Promise((resolve, reject) => {
            console.log('💾 Salvando ficheiro:', file.name, 'Tamanho:', file.size, 'Tipo:', file.type);
            
            // Verificações de segurança
            if (!file || !file.name) {
                reject(new Error('Ficheiro inválido'));
                return;
            }
            
            if (file.size === 0) {
                reject(new Error('Ficheiro vazio'));
                return;
            }
            
            const reader = new FileReader();
            
            // Timeout para leitura de ficheiros grandes
            const timeout = setTimeout(() => {
                reader.abort();
                reject(new Error('Timeout ao ler ficheiro (muito grande)'));
            }, 30000); // 30 segundos
            
            reader.onload = async (e) => {
                clearTimeout(timeout);
                try {
                    // Converter para base64
                    const base64Data = e.target.result.split(',')[1];
                    
                    if (!base64Data) {
                        throw new Error('Erro ao converter arquivo para base64');
                    }
                    
                    const fileData = {
                        name: file.name,
                        type: file.type,
                        data: base64Data,
                        size: file.size,
                        documentId: null,
                        uploadDate: new Date().toISOString()
                    };
                    
                    console.log('📋 Dados do ficheiro preparados:', {
                        name: fileData.name,
                        type: fileData.type,
                        size: fileData.size,
                        dataLength: fileData.data.length
                    });
                    
                    // Tentar IndexedDB primeiro
                    try {
                        const fileId = await dbManager.saveFile(fileData);
                        console.log('✅ Ficheiro guardado na IndexedDB com ID:', fileId);
                        resolve({ id: fileId, ...fileData });
                    } catch (dbError) {
                        console.warn('⚠️ IndexedDB falhou, usando localStorage:', dbError);
                        
                        // Fallback para localStorage
                        const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                        const storedFiles = JSON.parse(localStorage.getItem('storedFiles') || '{}');
                        storedFiles[fileId] = fileData;
                        localStorage.setItem('storedFiles', JSON.stringify(storedFiles));
                        
                        console.log('✅ Ficheiro guardado no localStorage com ID:', fileId);
                        resolve({ id: fileId, ...fileData });
                    }
                    
                } catch (error) {
                    console.error('❌ Erro ao guardar ficheiro:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                clearTimeout(timeout);
                console.error('❌ Erro do FileReader');
                reject(new Error('Erro ao ler arquivo'));
            };
            
            reader.onabort = () => {
                clearTimeout(timeout);
                console.error('❌ Leitura do ficheiro cancelada');
                reject(new Error('Leitura do ficheiro cancelada'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    async saveFile(file) {
        // Método legado - manter para compatibilidade
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = {
                    name: file.name,
                    type: file.type,
                    content: e.target.result,
                    size: file.size
                };
                
                const fileId = 'uploaded_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('file_' + fileId, JSON.stringify(fileData));
                resolve('uploaded/' + fileId + '.' + file.name.split('.').pop());
            };
            reader.readAsDataURL(file);
        });
    }

    async updateManifest() {
        // Actualizar el manifest con los nuevos documentos
        if (!this.manifest) return;

        // Agrupar documentos por capítulo
        const documentsByChapter = {};
        this.uploadedDocuments.forEach(doc => {
            if (!documentsByChapter[doc.capitulo]) {
                documentsByChapter[doc.capitulo] = [];
            }
            documentsByChapter[doc.capitulo].push(doc);
        });

        // Actualizar cada capítulo
        this.manifest.secciones.forEach(section => {
            if (documentsByChapter[section.codigo]) {
                section.items = section.items || [];
                section.items.push(...documentsByChapter[section.codigo]);
            }
        });

        // Guardar manifest actualizado
        localStorage.setItem('manifest', JSON.stringify(this.manifest));
    }

    resetUploadForm() {
        this.selectedFiles = [];
        document.getElementById('fileInput').value = '';
        document.getElementById('documentTitle').value = '';
        document.getElementById('documentTags').value = '';
        document.getElementById('documentStatus').value = 'Aprobado';
        this.updateUploadButton();
        
        // Restaurar área de upload
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.innerHTML = `
            <div class="upload-icon">📤</div>
            <h3>Arrastra archivos aquí o haz clic para seleccionar</h3>
            <p>Soporta: HTML, PDF, Word (.docx), Excel (.xlsx)</p>
            <input type="file" id="fileInput" multiple accept=".html,.pdf,.docx,.xlsx,.doc,.xls">
        `;
        
        // Re-attach event listeners
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });
    }

    async loadUploadedFiles() {
        const filesList = document.getElementById('filesList');
        
        try {
            console.log('📂 Carregando ficheiros subidos...');
            
            let documents = [];
            
            // Tentar IndexedDB primeiro
            try {
                documents = await dbManager.getDocuments();
                console.log('✅ Documentos carregados da IndexedDB:', documents.length);
            } catch (dbError) {
                console.warn('⚠️ IndexedDB falhou, usando localStorage:', dbError);
                
                // Fallback para localStorage
                const storedDocs = JSON.parse(localStorage.getItem('storedDocuments') || '[]');
                documents = storedDocs;
                console.log('✅ Documentos carregados do localStorage:', documents.length);
            }
            
            if (!documents || documents.length === 0) {
                filesList.innerHTML = '<p class="text-muted">No hay archivos subidos recientemente</p>';
                return;
            }

            // Ordenar por data (mais recentes primeiro) e pegar os últimos 5
            const recentDocs = documents
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);

            console.log('📋 Documentos recentes:', recentDocs);

            filesList.innerHTML = recentDocs.map(doc => `
                <div class="file-item" data-doc-id="${doc.id}">
                    <span class="file-icon">${this.getFileIcon(doc.type || doc.originalName)}</span>
                    <div class="file-info">
                        <div class="file-name">${doc.title || 'Sin título'}</div>
                        <div class="file-meta">${doc.chapter || 'Sin capítulo'} • ${this.formatDate(doc.date)} • ${doc.status || 'Sin estado'}</div>
                    </div>
                    <div class="file-actions">
                        <button class="file-action-btn" onclick="window.portal && window.portal.viewDocument('${doc.id}')" title="Ver">👁️</button>
                        <button class="file-action-btn" onclick="window.portal && window.portal.downloadDocument('${doc.id}')" title="Descargar">📥</button>
                        <button class="file-action-btn" onclick="window.portal && window.portal.printDocument('${doc.id}')" title="Imprimir">🖨️</button>
                        <button class="file-action-btn" onclick="window.portal && window.portal.deleteDocument('${doc.id}')" title="Eliminar">🗑️</button>
                    </div>
                </div>
            `).join('');
            
            console.log('✅ Lista de ficheiros atualizada');
        } catch (error) {
            console.error('❌ Erro ao carregar arquivos:', error);
            filesList.innerHTML = '<p class="text-muted">Erro ao carregar arquivos: ' + error.message + '</p>';
        }
    }

    async viewDocument(docId) {
        try {
            console.log('👁️ Abrindo documento:', docId);
            
            let document = null;
            let file = null;
            
            // Tentar IndexedDB primeiro
            try {
                document = await dbManager.getDocumentById(docId);
                if (document) {
                    file = await dbManager.getFile(document.fileId);
                    console.log('✅ Documento e ficheiro encontrados na IndexedDB');
                }
            } catch (dbError) {
                console.warn('⚠️ IndexedDB falhou, tentando localStorage:', dbError);
            }
            
            // Se não encontrou na IndexedDB, tentar localStorage
            if (!document || !file) {
                const storedDocs = JSON.parse(localStorage.getItem('storedDocuments') || '[]');
                document = storedDocs.find(doc => doc.id === docId);
                
                if (document) {
                    const storedFiles = JSON.parse(localStorage.getItem('storedFiles') || '{}');
                    file = storedFiles[document.fileId];
                    console.log('✅ Documento e ficheiro encontrados no localStorage');
                }
            }
            
            if (!document) {
                this.showToast('Documento não encontrado', 'error');
                return;
            }
            
            if (!file) {
                this.showToast('Arquivo não encontrado', 'error');
                return;
            }
            
            console.log('📋 Documento encontrado:', document);
            console.log('📁 Ficheiro encontrado:', file);
            
            // Abrir visualizador
            await documentViewer.openDocument(docId);
            
        } catch (error) {
            console.error('❌ Erro ao abrir documento:', error);
            this.showToast('Erro ao abrir documento: ' + error.message, 'error');
        }
    }

    async downloadDocument(docId) {
        try {
            console.log('📥 Descarregando documento:', docId);
            
            let document = null;
            let file = null;
            
            // Tentar IndexedDB primeiro
            try {
                document = await dbManager.getDocumentById(docId);
                if (document) {
                    file = await dbManager.getFile(document.fileId);
                    console.log('✅ Documento e ficheiro encontrados na IndexedDB para download');
                }
            } catch (dbError) {
                console.warn('⚠️ IndexedDB falhou, tentando localStorage:', dbError);
            }
            
            // Se não encontrou na IndexedDB, tentar localStorage
            if (!document || !file) {
                const storedDocs = JSON.parse(localStorage.getItem('storedDocuments') || '[]');
                document = storedDocs.find(doc => doc.id === docId);
                
                if (document) {
                    const storedFiles = JSON.parse(localStorage.getItem('storedFiles') || '{}');
                    file = storedFiles[document.fileId];
                    console.log('✅ Documento e ficheiro encontrados no localStorage para download');
                }
            }
            
            if (!document) {
                this.showToast('Documento não encontrado', 'error');
                return;
            }

            if (!file) {
                this.showToast('Arquivo não encontrado', 'error');
                return;
            }

            console.log('📋 Documento encontrado para download:', document);
            console.log('📁 Ficheiro encontrado para download:', file);

            // Converter base64 para blob
            const binaryString = atob(file.data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const blob = new Blob([bytes], { type: file.type });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name || document.originalName || 'documento';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('Documento descargado com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao descargar:', error);
            this.showToast('Erro ao descargar documento: ' + error.message, 'error');
        }
    }

    async deleteDocument(docId) {
        console.log('🗑️ Tentando eliminar documento:', docId);
        
        // Verificar se o documento existe antes de confirmar
        let document = null;
        try {
            // Tentar IndexedDB primeiro
            try {
                document = await dbManager.getDocumentById(docId);
                console.log('📋 Documento encontrado na IndexedDB:', document);
            } catch (dbError) {
                console.warn('⚠️ IndexedDB falhou, verificando localStorage:', dbError);
            }
            
            // Se não encontrou na IndexedDB, verificar localStorage
            if (!document) {
                const storedDocs = JSON.parse(localStorage.getItem('storedDocuments') || '[]');
                document = storedDocs.find(doc => doc.id === docId);
                console.log('📋 Documento encontrado no localStorage:', document);
            }
            
            if (!document) {
                this.showToast('Documento não encontrado', 'error');
                return;
            }
            
        } catch (error) {
            console.error('❌ Erro ao verificar documento:', error);
            this.showToast('Erro ao verificar documento: ' + error.message, 'error');
            return;
        }
        
        // Confirmação mais detalhada
        const confirmMessage = `Tem certeza que quer eliminar este documento?\n\n` +
                              `Título: ${document.title || 'Sem título'}\n` +
                              `ID: ${docId}\n` +
                              `Capítulo: ${document.chapter || 'N/A'}\n\n` +
                              `Esta ação é IRREVERSÍVEL!`;
        
        if (confirm(confirmMessage)) {
            try {
                let deleted = false;
                
                // Tentar IndexedDB primeiro
                try {
                    if (document && document.id) {
                        await dbManager.deleteDocument(docId);
                        console.log('✅ Documento eliminado da IndexedDB');
                        deleted = true;
                    }
                } catch (dbError) {
                    console.warn('⚠️ IndexedDB falhou, tentando localStorage:', dbError);
                }
                
                // Se não foi eliminado da IndexedDB, tentar localStorage
                if (!deleted) {
                    const storedDocs = JSON.parse(localStorage.getItem('storedDocuments') || '[]');
                    const docIndex = storedDocs.findIndex(doc => doc.id === docId);
                    
                    if (docIndex !== -1) {
                        document = storedDocs[docIndex];
                        
                        // Eliminar também o ficheiro associado
                        if (document.fileId) {
                            const storedFiles = JSON.parse(localStorage.getItem('storedFiles') || '{}');
                            delete storedFiles[document.fileId];
                            localStorage.setItem('storedFiles', JSON.stringify(storedFiles));
                            console.log('✅ Ficheiro associado eliminado do localStorage:', document.fileId);
                        }
                        
                        // Eliminar documento
                        storedDocs.splice(docIndex, 1);
                        localStorage.setItem('storedDocuments', JSON.stringify(storedDocs));
                        console.log('✅ Documento eliminado do localStorage');
                        deleted = true;
                    }
                }
                
                if (!deleted) {
                    this.showToast('Erro: Documento não foi eliminado', 'error');
                    return;
                }
                
                console.log('📋 Documento eliminado com sucesso:', document);
                this.showToast('Documento eliminado permanentemente!', 'success');
                
                // Recarregar lista de arquivos
                await this.loadUploadedFiles();
                
                // Se estivermos numa vista de capítulo, recarregar também
                if (this.currentChapter) {
                    await this.renderDocuments(this.currentChapter.items || []);
                }
                
            } catch (error) {
                console.error('❌ Erro ao eliminar documento:', error);
                this.showToast('Erro ao eliminar documento: ' + error.message, 'error');
            }
        } else {
            console.log('❌ Eliminação cancelada pelo utilizador');
        }
    }

    async clearAllDocuments() {
        console.log('🧹 Limpando documentos subidos...');
        
        // Obter documentos subidos
        const storedDocs = JSON.parse(localStorage.getItem('storedDocuments') || '[]');
        
        if (storedDocs.length === 0) {
            this.showToast('Não há documentos subidos para eliminar', 'info');
            return;
        }
        
        const confirmMessage = `ATENÇÃO: Esta ação irá eliminar ${storedDocs.length} documento(s) subido(s)!\n\n` +
                              `Documentos do sistema (manifest) NÃO serão afetados.\n\n` +
                              `Esta ação é IRREVERSÍVEL!\n\n` +
                              `Tem certeza que quer continuar?`;
        
        if (confirm(confirmMessage)) {
            try {
                let deletedCount = 0;
                
                console.log(`📊 Eliminando ${storedDocs.length} documentos subidos`);
                
                // Eliminar cada documento
                for (const doc of storedDocs) {
                    try {
                        // Eliminar documento do localStorage
                        const updatedDocs = JSON.parse(localStorage.getItem('storedDocuments') || '[]');
                        const docIndex = updatedDocs.findIndex(d => d.id === doc.id);
                        
                        if (docIndex !== -1) {
                            // Eliminar ficheiro associado
                            if (doc.fileId) {
                                const storedFiles = JSON.parse(localStorage.getItem('storedFiles') || '{}');
                                delete storedFiles[doc.fileId];
                                localStorage.setItem('storedFiles', JSON.stringify(storedFiles));
                            }
                            
                            // Eliminar documento
                            updatedDocs.splice(docIndex, 1);
                            localStorage.setItem('storedDocuments', JSON.stringify(updatedDocs));
                            
                            deletedCount++;
                            console.log(`✅ Eliminado ${deletedCount}/${storedDocs.length}: ${doc.title}`);
                        }
                    } catch (error) {
                        console.error(`❌ Erro ao eliminar ${doc.title}:`, error);
                    }
                }
                
                console.log('✅ Limpeza concluída');
                this.showToast(`${deletedCount} documentos subidos eliminados!`, 'success');
                
                // Recarregar lista
                await this.loadUploadedFiles();
                
                // Se estivermos numa vista de capítulo, recarregar também
                if (this.currentChapter) {
                    await this.renderDocuments(this.currentChapter.items || []);
                }
                
            } catch (error) {
                console.error('❌ Erro ao limpar documentos:', error);
                this.showToast('Erro ao limpar documentos: ' + error.message, 'error');
            }
        } else {
            console.log('❌ Limpeza cancelada pelo utilizador');
        }
    }

    async debugDocument(docId) {
        try {
            console.log('=== DEBUG DOCUMENT ===');
            console.log('Document ID:', docId);
            
            const document = await dbManager.getDocumentById(docId);
            console.log('Document:', document);
            
            if (document) {
                const file = await dbManager.getFile(document.fileId);
                console.log('File:', file);
                
                this.showToast(`Debug: Documento encontrado. Título: ${document.title}`, 'info');
            } else {
                this.showToast('Debug: Documento não encontrado', 'error');
            }
        } catch (error) {
            console.error('Debug error:', error);
            this.showToast('Debug error: ' + error.message, 'error');
        }
    }

    async printDocument(docId) {
        try {
            console.log('🖨️ Imprimindo documento:', docId);
            
            let document = null;
            let file = null;
            
            // Tentar IndexedDB primeiro
            try {
                document = await dbManager.getDocumentById(docId);
                if (document) {
                    file = await dbManager.getFile(document.fileId);
                    console.log('✅ Documento e ficheiro encontrados na IndexedDB para impressão');
                }
            } catch (dbError) {
                console.warn('⚠️ IndexedDB falhou, tentando localStorage:', dbError);
            }
            
            // Se não encontrou na IndexedDB, tentar localStorage
            if (!document || !file) {
                const storedDocs = JSON.parse(localStorage.getItem('storedDocuments') || '[]');
                document = storedDocs.find(doc => doc.id === docId);
                
                if (document) {
                    const storedFiles = JSON.parse(localStorage.getItem('storedFiles') || '{}');
                    file = storedFiles[document.fileId];
                    console.log('✅ Documento e ficheiro encontrados no localStorage para impressão');
                }
            }
            
            if (!document) {
                this.showToast('Documento não encontrado', 'error');
                return;
            }

            if (!file) {
                this.showToast('Arquivo não encontrado', 'error');
                return;
            }

            console.log('📋 Documento encontrado para impressão:', document);
            console.log('📁 Ficheiro encontrado para impressão:', file);

            // Criar janela de impressão
            const printWindow = window.open('', '_blank');
            
            if (file.type === 'text/html') {
                // Para HTML, converter base64 e mostrar
                const htmlContent = atob(file.data);
                printWindow.document.write(htmlContent);
                printWindow.document.close();
                
                // Aguardar carregamento e imprimir
                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                    }, 1000);
                };
            } else {
                // Para outros tipos, mostrar mensagem
                printWindow.document.write(`
                    <html>
                        <head><title>Impressão - ${document.title}</title></head>
                        <body>
                            <h1>${document.title}</h1>
                            <p>Tipo de ficheiro: ${file.type}</p>
                            <p>Para imprimir este tipo de ficheiro, descarregue-o primeiro.</p>
                            <button onclick="window.close()">Fechar</button>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            }
            
            this.showToast('Impressão iniciada', 'success');
            
        } catch (error) {
            console.error('❌ Erro ao imprimir documento:', error);
            this.showToast('Erro ao imprimir documento: ' + error.message, 'error');
        }
    }

    // Métodos para Modal de Añadir Documento
    showAddDocumentModal() {
        if (!this.currentChapter) {
            this.showToast('Selecciona un capítulo primero', 'warning');
            return;
        }

        this.currentChapterForUpload = this.currentChapter;
        document.getElementById('addDocumentTitle').textContent = `Añadir Documento - ${this.currentChapter.titulo}`;
        document.getElementById('addDocumentModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        this.resetAddDocumentForm();
    }

    hideAddDocumentModal() {
        document.getElementById('addDocumentModal').classList.add('hidden');
        document.body.style.overflow = '';
        this.currentChapterForUpload = null;
        this.selectedFileForChapter = null;
    }

    resetAddDocumentForm() {
        this.selectedFileForChapter = null;
        document.getElementById('chapterFileInput').value = '';
        document.getElementById('chapterDocumentTitle').value = '';
        document.getElementById('chapterDocumentTags').value = '';
        document.getElementById('chapterDocumentStatus').value = 'Aprobado';
        
        // Restaurar área de upload
        const uploadArea = document.getElementById('chapterFileUpload');
        uploadArea.innerHTML = `
            <div class="upload-icon">📤</div>
            <h4>Arrastra archivo aquí o haz clic para seleccionar</h4>
            <p>Soporta: HTML, PDF, Word (.docx), Excel (.xlsx)</p>
            <input type="file" id="chapterFileInput" accept=".html,.pdf,.docx,.xlsx,.doc,.xls">
        `;
        
        // Re-attach event listeners
        document.getElementById('chapterFileInput').addEventListener('change', (e) => {
            this.handleChapterFileSelect(e.target.files[0]);
        });
        
        this.updateSaveButton();
    }

    handleChapterFileSelect(file) {
        if (!file) return;
        
        this.selectedFileForChapter = file;
        this.updateSaveButton();
        this.showSelectedChapterFile();
    }

    showSelectedChapterFile() {
        const uploadArea = document.getElementById('chapterFileUpload');
        if (this.selectedFileForChapter) {
            uploadArea.innerHTML = `
                <div class="selected-file">
                    <div class="file-preview">
                        <span class="file-icon">${this.getFileIcon(this.selectedFileForChapter.type)}</span>
                        <div class="file-info">
                            <div class="file-name">${this.selectedFileForChapter.name}</div>
                            <div class="file-meta">${this.formatFileSize(this.selectedFileForChapter.size)} • ${this.selectedFileForChapter.type}</div>
                        </div>
                        <button class="remove-file-btn" onclick="portal.removeSelectedFile()" title="Eliminar archivo">✕</button>
                    </div>
                </div>
            `;
        }
    }

    removeSelectedFile() {
        this.selectedFileForChapter = null;
        this.resetAddDocumentForm();
    }

    updateSaveButton() {
        const saveBtn = document.getElementById('saveDocument');
        const hasFile = this.selectedFileForChapter !== null;
        const hasTitle = document.getElementById('chapterDocumentTitle').value.trim() !== '';
        
        saveBtn.disabled = !hasFile || !hasTitle;
    }

    async saveChapterDocument() {
        if (!this.selectedFileForChapter || !this.currentChapterForUpload) return;

        const title = document.getElementById('chapterDocumentTitle').value.trim();
        const tags = document.getElementById('chapterDocumentTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const status = document.getElementById('chapterDocumentStatus').value;

        try {
            this.showLoading(true);
            
            const documentData = {
                id: Date.now() + Math.random(),
                titulo: title,
                ruta: await this.saveFile(this.selectedFileForChapter),
                tags: tags,
                fecha: new Date().toISOString().split('T')[0],
                estado: status,
                capitulo: this.currentChapterForUpload.codigo,
                tipo: this.selectedFileForChapter.type,
                tamaño: this.selectedFileForChapter.size,
                nombreOriginal: this.selectedFileForChapter.name
            };

            // Agregar al capítulo actual
            if (!this.currentChapterForUpload.items) {
                this.currentChapterForUpload.items = [];
            }
            this.currentChapterForUpload.items.push(documentData);

            // Agregar a documentos subidos
            this.uploadedDocuments.push(documentData);

            // Guardar en localStorage
            localStorage.setItem('uploadedDocuments', JSON.stringify(this.uploadedDocuments));
            localStorage.setItem('manifest', JSON.stringify(this.manifest));
            
            this.showToast('Documento añadido correctamente', 'success');
            this.hideAddDocumentModal();
            
            // Actualizar la vista del capítulo
            await this.renderDocuments(this.currentChapterForUpload.items);
            this.updateStats();
            
        } catch (error) {
            console.error('Error saving document:', error);
            this.showToast('Error al guardar el documento', 'error');
        } finally {
            this.showLoading(false);
        }
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar DatabaseManager
    window.dbManager = new DatabaseManager();
    console.log('🗄️ DatabaseManager inicializado');
    
    // Inicializar Portal
    window.portal = new PortalCalidad();
    console.log('🏗️ Portal inicializado');
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
