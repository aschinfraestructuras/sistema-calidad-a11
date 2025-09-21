// Portal de Calidad - Sistema Simples e Funcional
console.log('🚀 Carregando Portal de Calidad...');

class PortalCalidad {
    constructor() {
        this.manifest = null;
        this.currentChapter = null;
        this.uploadedDocuments = [];
        
        // Sistema de autenticação
        this.validPasswords = [
            'asch2025',
            'ohlaasch2025', 
            'calidadA11_2025'
        ];
        this.isAuthenticated = false;
        
        // Cache inteligente para performance
        this.cache = {
            documents: new Map(),
            chapters: new Map(),
            searchResults: new Map(),
            lastUpdate: Date.now()
        };
        
        // Debounce para busca
        this.searchTimeout = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando Portal...');
        
        // Verificar se já está autenticado
        this.checkAuthentication();
        
        if (!this.isAuthenticated) {
            this.showLoginModal();
            return;
        }
        
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
        const text = await response.text();
        this.manifest = JSON.parse(text);
        console.log('✅ Manifest carregado:', this.manifest.secciones.length, 'capítulos');
    }

    setupEvents() {
        console.log('🔧 Configurando eventos...');
        
        // PREVENIR DUPLICAÇÃO DE EVENTOS
        if (this.eventsSetup) {
            console.log('⚠️ Eventos já configurados, pulando...');
            return;
        }
        this.eventsSetup = true;
        
        // Busca
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            console.log('✅ Campo de pesquisa encontrado');
            searchInput.addEventListener('input', (e) => {
                console.log('🔍 Pesquisa digitada:', e.target.value);
                this.debouncedSearch(e.target.value);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('🔍 Pesquisa com Enter:', e.target.value);
                    this.debouncedSearch(e.target.value);
                }
            });
        } else {
            console.error('❌ Campo de pesquisa não encontrado!');
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

        const editBtn = document.getElementById('editBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.editDocument());
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
                this.hideAdvancedSearch();
            }
        });

        // Busca Avançada
        const advancedSearchBtn = document.getElementById('advancedSearchBtn');
        if (advancedSearchBtn) {
            advancedSearchBtn.addEventListener('click', () => this.showAdvancedSearch());
        }

        const closeAdvancedSearchModal = document.getElementById('closeAdvancedSearchModal');
        if (closeAdvancedSearchModal) {
            closeAdvancedSearchModal.addEventListener('click', () => this.hideAdvancedSearch());
        }

        const executeAdvancedSearch = document.getElementById('executeAdvancedSearch');
        if (executeAdvancedSearch) {
            executeAdvancedSearch.addEventListener('click', () => this.executeAdvancedSearch());
        }

        const clearAdvancedFilters = document.getElementById('clearAdvancedFilters');
        if (clearAdvancedFilters) {
            clearAdvancedFilters.addEventListener('click', () => this.clearAdvancedFilters());
        }

        // Fechar modal de busca avançada clicando no overlay
        const advancedSearchModal = document.getElementById('advancedSearchModal');
        if (advancedSearchModal) {
            advancedSearchModal.addEventListener('click', (e) => {
                if (e.target === advancedSearchModal || e.target.classList.contains('modal-overlay')) {
                    this.hideAdvancedSearch();
                }
            });
        }

        // Stat-cards removidos - navegação desabilitada para evitar conflitos

        // Menu mobile
        this.setupMobileMenu();

        // Tema
        this.initializeTheme();

        console.log('✅ Eventos configurados');
    }

    // Função removida - navegação dos stat-cards desabilitada

    // Funções de navegação dos stat-cards removidas - simplificação

    // Nova função para configurar menu mobile
    setupMobileMenu() {
        console.log('📱 Configurando menu mobile...');
        
        // Verificar se estamos em mobile
        this.isMobile = window.innerWidth <= 768;
        
        // Listener para mudanças de tamanho da tela
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
            this.updateMobileLayout();
        });
        
        // Inicializar layout mobile
        this.updateMobileLayout();
    }

    // Função para alternar menu mobile
    toggleMobileMenu() {
        console.log('📱 Alternando menu mobile...');
        
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.querySelector('.sidebar');
        
        if (mobileMenuBtn && sidebar) {
            const isActive = mobileMenuBtn.classList.contains('active');
            
            if (isActive) {
                // Fechar menu
                mobileMenuBtn.classList.remove('active');
                sidebar.classList.remove('mobile-open');
                document.body.classList.remove('mobile-menu-open');
            } else {
                // Abrir menu
                mobileMenuBtn.classList.add('active');
                sidebar.classList.add('mobile-open');
                document.body.classList.add('mobile-menu-open');
            }
        }
    }

    // Função para atualizar layout mobile
    updateMobileLayout() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.querySelector('.sidebar');
        
        if (this.isMobile) {
            // Mostrar botão hambúrguer
            if (mobileMenuBtn) {
                mobileMenuBtn.style.display = 'flex';
            }
            
            // Esconder sidebar por padrão
            if (sidebar) {
                sidebar.classList.add('mobile-hidden');
            }
        } else {
            // Esconder botão hambúrguer
            if (mobileMenuBtn) {
                mobileMenuBtn.style.display = 'none';
                mobileMenuBtn.classList.remove('active');
            }
            
            // Mostrar sidebar
            if (sidebar) {
                sidebar.classList.remove('mobile-hidden', 'mobile-open');
            }
            
            document.body.classList.remove('mobile-menu-open');
        }
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
        
        // Verificar se tem subcapítulos
        const hasSubchapters = section.subcapitulos && section.subcapitulos.length > 0;
        
        console.log('🔍 DEBUG - Capítulo:', section.codigo, section.titulo);
        console.log('🔍 DEBUG - Tem subcapítulos?', hasSubchapters);
        console.log('🔍 DEBUG - Subcapítulos:', section.subcapitulos);
        
        if (hasSubchapters) {
            console.log('📁 Renderizando subcapítulos...');
            this.renderSubchapters();
        } else {
            console.log('📄 Renderizando documentos...');
        this.renderDocuments();
        }
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
        const chaptersList = document.getElementById('chaptersList');
        
        // Mostrar todas as seções do dashboard
        if (welcomeSection) welcomeSection.classList.remove('hidden');
        if (documentsSection) documentsSection.classList.add('hidden');
        if (chaptersList) chaptersList.classList.remove('hidden'); // Mostrar lista de capítulos no dashboard
        
        // Garantir que a barra lateral está visível - FORÇAR VISIBILIDADE
        this.ensureSidebarVisible();
        
        document.querySelectorAll('.chapter-item').forEach(item => {
            item.classList.remove('active');
        });
        
        this.updateStats();
    }

    // Nova função para garantir que a barra lateral sempre esteja visível
    ensureSidebarVisible() {
        console.log('🔧 Garantindo visibilidade da barra lateral...');
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            // Remover todas as classes que podem esconder
            sidebar.classList.remove('hidden', 'mobile-hidden');
            
            // Forçar estilos de visibilidade
            sidebar.style.display = 'flex';
            sidebar.style.visibility = 'visible';
            sidebar.style.opacity = '1';
            sidebar.style.position = 'sticky';
            sidebar.style.left = '0';
            sidebar.style.transform = 'translateX(0)';
            
            console.log('✅ Barra lateral forçada a ser visível');
        }
    }

    // Função para melhorar automaticamente todos os ícones de pasta
    enhanceFolderIcons() {
        console.log('🎨 Melhorando elementos visuais das pastas...');
        
        // Selecionar todos os ícones de pasta
        const folderIcons = document.querySelectorAll('.chapter-icon, .subchapter-icon, .folder-icon, [class*="icon"]');
        
        folderIcons.forEach((icon, index) => {
            // Adicionar classes CSS premium
            icon.classList.add('chapter-icon');
            
            // Determinar tipo baseado no contexto
            const parentText = icon.closest('.chapter-item, .subchapter-item, .document-item')?.textContent?.toLowerCase() || '';
            let iconType = 'default';
            
            if (parentText.includes('procedimiento') || parentText.includes('pac')) {
                iconType = 'procedimientos';
            } else if (parentText.includes('laboratorio') || parentText.includes('ensayo')) {
                iconType = 'laboratorio';
            } else if (parentText.includes('calidad') || parentText.includes('control')) {
                iconType = 'calidad';
            } else if (parentText.includes('documento') || parentText.includes('certificado')) {
                iconType = 'documentos';
            } else if (parentText.includes('ensayo') || parentText.includes('prueba')) {
                iconType = 'ensayos';
            } else if (parentText.includes('normativa') || parentText.includes('reglamento')) {
                iconType = 'normativas';
            } else if (parentText.includes('auditoria') || parentText.includes('inspección')) {
                iconType = 'auditorias';
            }
            
            // Aplicar tipo específico
            icon.setAttribute('data-type', iconType);
            
            // Adicionar ícone Unicode mais sofisticado
            if (!icon.textContent || icon.textContent.trim() === '') {
                const iconMap = {
                    'procedimientos': '📋',
                    'laboratorio': '🧪',
                    'calidad': '⭐',
                    'documentos': '📄',
                    'ensayos': '🔬',
                    'normativas': '📜',
                    'auditorias': '🔍',
                    'default': '📁'
                };
                icon.textContent = iconMap[iconType] || iconMap['default'];
            }
            
            // Adicionar animação de entrada
            icon.style.animationDelay = `${index * 0.1}s`;
            icon.style.animation = 'scaleIn 0.6s ease-out forwards';
        });
        
        console.log(`✅ ${folderIcons.length} ícones de pasta melhorados automaticamente`);
    }

    // Função removida - cards do dashboard sempre visíveis

    updateBreadcrumb(section) {
        const breadcrumb = document.getElementById('breadcrumb');
        const currentSection = document.getElementById('currentSection');
        if (breadcrumb) {
            breadcrumb.innerHTML = `
                <span class="breadcrumb-item" onclick="portal.showDashboard()" style="cursor: pointer; color: var(--primary); text-decoration: underline;">🏠 Dashboard</span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item active" id="currentSection">${section.codigo} - ${section.titulo}</span>
            `;
        }
        if (currentSection) {
            currentSection.textContent = `${section.codigo} - ${section.titulo}`;
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
        
        // Verificar cache primeiro
        const cachedData = this.getCachedDocuments(this.currentChapter.codigo);
        if (cachedData) {
            console.log('📦 Usando dados em cache para renderização');
            this.renderDocumentsFromCache(cachedData, documentsGrid, sectionTitle, sectionCode, documentCount);
            return;
        }
        
        // Filtrar apenas documentos normais (não separadores)
        const manifestDocs = (this.currentChapter.items || []).filter(doc => doc.tipo !== 'separador');
        const uploadedDocs = this.uploadedDocuments.filter(doc => doc.chapter === this.currentChapter.codigo);
        const allDocs = [...manifestDocs, ...uploadedDocs];
        
        console.log('📄 Documentos encontrados:', allDocs.length);
        console.log('📄 Manifest docs:', manifestDocs.length);
        console.log('📄 Uploaded docs:', uploadedDocs.length);
        
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
        
        // Salvar no cache para próximas renderizações
        this.setCachedDocuments(this.currentChapter.codigo, {
            manifestDocs,
            uploadedDocs,
            allDocs
        });
        
        // Usar batch DOM updates para melhor performance
        this.batchDOMUpdates([
            () => {
        documentsGrid.innerHTML = allDocs.map(doc => this.createDocumentCard(doc)).join('');
            }
        ]);
        
        console.log('✅ Documentos renderizados');
    }
    
    renderDocumentsFromCache(cachedData, documentsGrid, sectionTitle, sectionCode, documentCount) {
        const { manifestDocs, uploadedDocs, allDocs } = cachedData;
        
        // Atualizar elementos da interface
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
        
        // Renderizar usando cache
        documentsGrid.innerHTML = allDocs.map(doc => this.createDocumentCard(doc)).join('');
        console.log('✅ Documentos renderizados do cache');
    }

    renderSubchapters() {
        console.log('📁 Renderizando subcapítulos...');
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
        
        // Usar a propriedade subcapitulos
        const subchapters = this.currentChapter.subcapitulos || [];
        
        console.log('📁 Subcapítulos encontrados:', subchapters.length);
        
        if (sectionTitle) sectionTitle.textContent = `Subcapítulos de ${this.currentChapter.titulo}`;
        if (sectionCode) sectionCode.textContent = this.currentChapter.codigo;
        if (documentCount) documentCount.textContent = `${subchapters.length} subcapítulos`;
        
        if (subchapters.length === 0) {
            documentsGrid.innerHTML = `
                <div class="no-documents">
                    <div class="no-documents-icon">📁</div>
                    <h3>Nenhum subcapítulo encontrado</h3>
                    <p>Adicione subcapítulos ao Capítulo ${this.currentChapter.codigo} no manifest.json</p>
                </div>
            `;
            return;
        }
        
        // Criar grade de subcapítulos
        documentsGrid.innerHTML = subchapters.map(subchapter => `
            <div class="subchapter-card" onclick="portal.showSubchapter('${subchapter.titulo}')">
                <div class="subchapter-header">
                    <div class="subchapter-icon">${this.getSubchapterIcon(subchapter.titulo)}</div>
                    <div class="subchapter-status">${subchapter.estado || 'Activo'}</div>
                </div>
                <div class="subchapter-content">
                    <h3 class="subchapter-title">${subchapter.titulo}</h3>
                    <p class="subchapter-description">${this.getSubchapterDescription(subchapter.titulo)}</p>
                    <div class="subchapter-meta">
                        <span class="subchapter-path">${subchapter.ruta}</span>
                    </div>
                    ${subchapter.tags ? `
                        <div class="subchapter-tags">
                            ${subchapter.tags.map(tag => `<span class="subchapter-tag">#${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="subchapter-actions">
                    <button class="btn-primary" onclick="event.stopPropagation(); portal.showSubchapter('${subchapter.titulo}')">
                        <span class="btn-icon">📂</span>
                        <span class="btn-text">Abrir Subcapítulo</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    getSubchapterIcon(title) {
        if (title.includes('Aceros')) return '🔬';
        if (title.includes('Aglomerado')) return '🛣️';
        if (title.includes('CRT')) return '📊';
        if (title.includes('Deflexiones')) return '📏';
        if (title.includes('Densidades')) return '⚖️';
        if (title.includes('Hormigón')) return '🏗️';
        if (title.includes('Lotificación')) return '📋';
        if (title.includes('Placas')) return '🔧';
        if (title.includes('Préstamos')) return '🏗️';
        if (title.includes('Sondeos')) return '🔍';
        if (title.includes('Suelo Cemento')) return '🧱';
        if (title.includes('Suelo Estabilizado')) return '🛠️';
        if (title.includes('Suelos')) return '🌍';
        if (title.includes('Testigos')) return '🔬';
        if (title.includes('Zahorras')) return '🪨';
        if (title.includes('Anexos')) return '📎';
        return '📁';
    }

    getSubchapterDescription(title) {
        if (title.includes('Aceros')) return 'Ensayos de tracción y soldadura de aceros';
        if (title.includes('Aglomerado')) return 'Ensayos de carreteras y asfalto';
        if (title.includes('CRT')) return 'Control de resistencia y tracción';
        if (title.includes('Deflexiones')) return 'Medición de rugosidad IRI';
        if (title.includes('Densidades')) return 'Ensayos Proctor y de campo';
        if (title.includes('Hormigón')) return 'Resistencia y consistencia de hormigón';
        if (title.includes('Lotificación')) return 'Control de lotes y trazabilidad';
        if (title.includes('Placas')) return 'Módulos de elasticidad';
        if (title.includes('Préstamos')) return 'Materiales de préstamo';
        if (title.includes('Sondeos')) return 'Investigación del terreno';
        if (title.includes('Suelo Cemento')) return 'Estabilización con cemento';
        if (title.includes('Suelo Estabilizado')) return 'Tratamientos de suelo';
        if (title.includes('Suelos')) return 'Caracterización geotécnica';
        if (title.includes('Testigos')) return 'Muestras de hormigón';
        if (title.includes('Zahorras')) return 'Materiales granulares';
        if (title.includes('Anexos')) return 'Documentación complementaria';
        return 'Subcapítulo de laboratorio';
    }

    showSubchapter(subchapterTitle) {
        console.log('📂 Mostrando subcapítulo:', subchapterTitle);
        
        // Encontrar o subcapítulo
        const subchapter = this.currentChapter.subcapitulos.find(sub => sub.titulo === subchapterTitle);
        if (!subchapter) {
            this.showToast('Subcapítulo no encontrado', 'error');
            return;
        }
        
        this.currentSubchapter = subchapter;
        
        // Atualizar breadcrumb
        this.updateSubchapterBreadcrumb(subchapter);
        
        // Atualizar título da seção
        const sectionTitle = document.getElementById('sectionTitle');
        const sectionCode = document.getElementById('sectionCode');
        const documentCount = document.getElementById('documentCount');
        
        if (sectionTitle) {
            sectionTitle.textContent = subchapter.titulo;
        }
        if (sectionCode) {
            sectionCode.textContent = `${this.currentChapter.codigo} › ${subchapter.titulo.split(' - ')[0]}`;
        }
        if (documentCount) {
            const subchapterName = subchapter.titulo.split(' - ')[0].replace('🔬 ', '').replace('🛣️ ', '').replace('🏗️ ', '').replace('📊 ', '').replace('🧪 ', '').replace('📎 ', '').replace('📦 ', '').replace('🔍 ', '');
            const totalDocs = (subchapter.items || []).length + this.uploadedDocuments.filter(doc => 
                doc.chapter === this.currentChapter.codigo && 
                doc.titulo.toLowerCase().includes(subchapterName.toLowerCase())
            ).length;
            documentCount.textContent = `${totalDocs} documento${totalDocs !== 1 ? 's' : ''}`;
        }
        
        // Carregar documentos do subcapítulo
        this.renderSubchapterDocuments(subchapter);
    }

    updateSubchapterBreadcrumb(subchapter) {
        const breadcrumb = document.getElementById('breadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = `
                <span class="breadcrumb-item" onclick="portal.showDashboard()" style="cursor: pointer; color: var(--primary); text-decoration: underline;">🏠 Dashboard</span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item" onclick="portal.selectChapter(portal.currentChapter)" style="cursor: pointer; color: var(--primary); text-decoration: underline;">${this.currentChapter.codigo} - ${this.currentChapter.titulo}</span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item active">${subchapter.titulo.split(' - ')[0]}</span>
            `;
        }
    }

    renderSubchapterDocuments(subchapter) {
        const documentsGrid = document.getElementById('documentsGrid');
        if (!documentsGrid) return;
        
        // Buscar documentos do manifest (subchapter.items)
        const manifestDocs = subchapter.items || [];
        
        // Buscar documentos subidos para este subcapítulo
        const subchapterName = subchapter.titulo.split(' - ')[0].replace('🔬 ', '').replace('🛣️ ', '').replace('🏗️ ', '').replace('📊 ', '').replace('🧪 ', '').replace('📎 ', '').replace('📦 ', '').replace('🔍 ', '');
        const uploadedDocs = this.uploadedDocuments.filter(doc => 
            doc.chapter === this.currentChapter.codigo && 
            doc.titulo.toLowerCase().includes(subchapterName.toLowerCase())
        );
        
        // Combinar documentos do manifest e subidos
        const allDocs = [...manifestDocs, ...uploadedDocs];
        
        console.log(`🔍 Buscando documentos para subcapítulo: ${subchapterName}`);
        console.log(`📄 Documentos do manifest: ${manifestDocs.length}`);
        console.log(`📄 Documentos subidos: ${uploadedDocs.length}`);
        console.log(`📄 Total de documentos: ${allDocs.length}`);
        
        documentsGrid.innerHTML = `
            <div class="subchapter-documents">
                <div class="subchapter-info">
                    <div class="subchapter-icon-large">${this.getSubchapterIcon(subchapter.titulo)}</div>
                    <h3>${subchapter.titulo}</h3>
                    <p>${this.getSubchapterDescription(subchapter.titulo)}</p>
                    <div class="subchapter-path-info">
                        <strong>📂 Pasta:</strong> ${subchapter.ruta}
                    </div>
                </div>
                
                <div class="documents-list">
                    ${allDocs.length > 0 ? `
                        <div class="documents-grid">
                            ${allDocs.map(doc => this.createDocumentCard(doc)).join('')}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <div class="empty-icon">📭</div>
                            <h3>Nenhum documento encontrado</h3>
                            <p>Adicione documentos PDF nesta pasta para vê-los aqui</p>
                            <div class="add-document-instructions">
                                <h4>💡 Como adicionar documentos:</h4>
                                <ol>
                                    <li>Use o botão "Subir Documento" abaixo</li>
                                    <li>Selecione o Capítulo ${this.currentChapter ? this.currentChapter.codigo : 'atual'}</li>
                                    <li>Inclua "${subchapterName}" no título do documento</li>
                                    <li>Os documentos aparecerão automaticamente aqui</li>
                                </ol>
                            </div>
                        </div>
                    `}
                </div>
                
                <div class="subchapter-actions">
                    <button class="btn-primary" onclick="portal.showUploadForSubchapter('${subchapterName}')">
                        <span class="btn-icon">📤</span>
                        <span class="btn-text">Subir Documento</span>
                    </button>
                    <button class="btn-secondary" onclick="portal.selectChapter(portal.currentChapter)">
                        <span class="btn-icon">🔙</span>
                        <span class="btn-text">Voltar aos Subcapítulos</span>
                    </button>
                </div>
            </div>
        `;
    }

    createDocumentCard(doc) {
        const isUploaded = doc.id && doc.id.startsWith('uploaded_');
        const isExternal = doc.tipo === 'externo' || this.isExternalUrl(doc.ruta);
        const status = (doc.estado || 'Aprobado').toLowerCase();
        const ext = this.getFileExtension(doc.ruta || doc.fileName);
        const tags = doc.tags || [];
        const isFavorite = this.isFavorite(doc.id || 'manifest_' + (doc.titulo || doc.nombre));
        
        return `
            <div class="document-card ${isExternal ? 'external-document' : ''} ${isFavorite ? 'favorite' : ''}">
                <div class="document-header">
                    <div class="document-title">${doc.titulo || doc.nombre}</div>
                    <div class="document-header-right">
                        <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="portal.toggleFavorite('${doc.id || 'manifest_' + (doc.titulo || doc.nombre)}')" title="${isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
                            <span class="favorite-icon">${isFavorite ? '⭐' : '☆'}</span>
                        </button>
                    <div class="document-status ${status}">${doc.estado || 'Aprobado'}</div>
                    </div>
                </div>
                <div class="document-meta">
                    <div class="document-date">
                        <span>📅</span>
                        <span>${this.formatDate(doc.fecha || doc.uploadDate)}</span>
                    </div>
                    <div class="document-type">${isExternal ? 'EXTERNO' : ext.toUpperCase()}</div>
                    ${doc.tamaño ? `<div class="document-size">📊 ${doc.tamaño}</div>` : ''}
                    ${isUploaded ? '<div class="uploaded-badge">📤 Subido</div>' : ''}
                    ${isExternal ? '<div class="external-badge">🌐 Externo</div>' : ''}
                </div>
                ${doc.descripcion ? `
                    <div class="document-description">
                        <p>${doc.descripcion}</p>
                    </div>
                ` : ''}
                ${tags.length > 0 ? `
                    <div class="document-tags">
                        ${tags.map(tag => `<span class="document-tag">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="document-actions">
                    <button class="btn-primary" onclick="portal.showViewer('${doc.id || 'manifest_' + (doc.titulo || doc.nombre)}')">
                        <span class="btn-icon">${isExternal ? '🔗' : '👁️'}</span>
                        <span class="btn-text">${isExternal ? 'Abrir Externo' : 'Ver Documento'}</span>
                    </button>
                    <button class="btn-secondary" onclick="portal.editDocument('${doc.id || 'manifest_' + (doc.titulo || doc.nombre)}')" title="Editar">
                        <span class="btn-icon">✏️</span>
                        </button>
                    <button class="btn-danger btn-icon-only" onclick="portal.deleteDocument('${doc.id || 'manifest_' + (doc.titulo || doc.nombre)}')" title="Eliminar">
                        <span class="btn-icon">🗑️</span>
                    </button>
                </div>
            </div>
        `;
    }

    getFileExtension(fileName) {
        return fileName ? fileName.split('.').pop().toLowerCase() : 'html';
    }

    isExternalUrl(url) {
        if (!url) return false;
        return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
    }

    showExternalDocument() {
        const frame = document.getElementById('documentFrame');
        if (!frame) return;

        const doc = this.currentDocument;
        
        // Criar interface para documento externo
        frame.src = 'about:blank';
        frame.onload = () => {
            const iframeDoc = frame.contentDocument || frame.contentWindow.document;
            if (iframeDoc) {
                iframeDoc.body.innerHTML = `
                    <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 600px; width: 100%;">
                            <div style="font-size: 4rem; margin-bottom: 20px;">📁</div>
                            <h2 style="color: #1e3a8a; margin-bottom: 16px; font-size: 1.8rem;">${doc.titulo}</h2>
                            ${doc.descripcion ? `<p style="color: #64748b; margin-bottom: 24px; line-height: 1.6;">${doc.descripcion}</p>` : ''}
                            ${doc.tamaño ? `<p style="color: #f59e0b; font-weight: 600; margin-bottom: 24px;">📊 Tamaño: ${doc.tamaño}</p>` : ''}
                            <div style="margin-bottom: 32px;">
                                <a href="${doc.ruta}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 1.1rem; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3); transition: all 0.3s ease;">
                                    🔗 Abrir Documento Externo
                                </a>
                            </div>
                            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                                <p style="margin: 0; color: #475569; font-size: 0.9rem;">
                                    <strong>💡 Dica:</strong> Este documento está armazenado externamente debido ao seu tamaño. 
                                    Clique no botão acima para abri-lo em uma nova aba.
                                </p>
                            </div>
                            ${doc.tags ? `
                                <div style="margin-top: 24px;">
                                    <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 8px;">Tags:</p>
                                    <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
                                        ${doc.tags.map(tag => `<span style="background: #e2e8f0; color: #475569; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem;">${tag}</span>`).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
        };
    }

    formatDate(dateString) {
        if (!dateString) return 'Sin fecha';
        return new Date(dateString).toLocaleDateString('es-ES');
    }

    // ===== OTIMIZAÇÕES DE PERFORMANCE =====
    
    debouncedSearch(query) {
        // Limpar timeout anterior
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Se query vazia, limpar resultados imediatamente
        if (!query.trim()) {
            this.clearSearchResults();
            return;
        }
        
        // Debounce de 300ms para evitar buscas excessivas
        this.searchTimeout = setTimeout(() => {
            this.searchDocuments(query);
        }, 300);
    }
    
    clearSearchResults() {
        // Limpar resultados de busca e mostrar dashboard
        this.showDashboard();
    }
    
    // Cache inteligente para documentos
    getCachedDocuments(chapterCode) {
        const cacheKey = `chapter_${chapterCode}`;
        const cached = this.cache.documents.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp < 300000)) { // 5 minutos
            console.log('📦 Usando cache para capítulo:', chapterCode);
            return cached.data;
        }
        
        return null;
    }
    
    setCachedDocuments(chapterCode, data) {
        const cacheKey = `chapter_${chapterCode}`;
        this.cache.documents.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
        console.log('💾 Cache salvo para capítulo:', chapterCode);
    }
    
    // Otimização de DOM - batch updates
    batchDOMUpdates(updates) {
        // Usar requestAnimationFrame para otimizar renderização
        requestAnimationFrame(() => {
            updates.forEach(update => update());
        });
    }
    
    // Compressão de imagens para melhor performance
    compressImage(file, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calcular novas dimensões mantendo proporção
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Desenhar imagem redimensionada
                ctx.drawImage(img, 0, 0, width, height);
                
                // Converter para blob com compressão
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }
    
    // Lazy loading para imagens
    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }

    searchDocuments(term) {
        console.log('🔍 Função searchDocuments chamada com:', term);
        
        if (!term || term.trim() === '') {
            console.log('🔍 Termo vazio, mostrando dashboard');
            // Se não há termo de busca, mostrar dashboard
            this.showDashboard();
            return;
        }
        
        const searchTerm = term.toLowerCase().trim();
        const results = [];
        
        // Buscar nos documentos do manifest
        if (this.manifest) {
            this.manifest.secciones.forEach(seccion => {
                if (seccion.items && seccion.items.length > 0) {
                    seccion.items.forEach(doc => {
                    const titulo = doc.titulo ? doc.titulo.toLowerCase() : '';
                    const descripcion = doc.descripcion ? doc.descripcion.toLowerCase() : '';
                    const tags = doc.tags ? doc.tags.join(' ').toLowerCase() : '';
                    const codigo = doc.codigo ? doc.codigo.toLowerCase() : '';
                    
                    if (titulo.includes(searchTerm) || 
                        descripcion.includes(searchTerm) || 
                        tags.includes(searchTerm) || 
                        codigo.includes(searchTerm)) {
                        results.push({
                            ...doc,
                            seccion: seccion.titulo,
                            tipo: 'manifest'
                        });
                    }
                });
                }
            });
        }
        
        // Buscar nos documentos subidos
        this.uploadedDocuments.forEach(doc => {
            const titulo = doc.titulo ? doc.titulo.toLowerCase() : '';
            const descripcion = doc.descripcion ? doc.descripcion.toLowerCase() : '';
            const tags = doc.tags ? doc.tags.join(' ').toLowerCase() : '';
            const codigo = doc.codigo ? doc.codigo.toLowerCase() : '';
            
            if (titulo.includes(searchTerm) || 
                descripcion.includes(searchTerm) || 
                tags.includes(searchTerm) || 
                codigo.includes(searchTerm)) {
                results.push({
                    ...doc,
                    seccion: doc.chapter,
                    tipo: 'uploaded'
                });
            }
        });
        
        // Mostrar resultados
        this.showSearchResults(results, searchTerm);
    }
    
    showSearchResults(results, searchTerm) {
        console.log('📋 Mostrando resultados:', results.length);
        
        // Esconder dashboard e mostrar seção de documentos
        const welcomeSection = document.getElementById('welcomeSection');
        const documentsSection = document.getElementById('documentsSection');
        
        if (welcomeSection) welcomeSection.classList.add('hidden');
        if (documentsSection) documentsSection.classList.remove('hidden');
        
        // Atualizar título e breadcrumb
        const sectionTitle = document.getElementById('sectionTitle');
        const breadcrumb = document.getElementById('breadcrumb');
        const documentCount = document.getElementById('documentCount');
        
        if (sectionTitle) {
            sectionTitle.textContent = `Resultados de búsqueda: "${searchTerm}"`;
        }
        
        if (breadcrumb) {
            breadcrumb.innerHTML = `
                <span class="breadcrumb-item" onclick="portal.showDashboard()" style="cursor: pointer;">Inicio</span>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item">Búsqueda</span>
            `;
        }
        
        if (documentCount) {
            documentCount.textContent = `${results.length} resultado${results.length !== 1 ? 's' : ''}`;
        }
        
        // Renderizar resultados
        this.renderSearchResults(results);
    }
    
    renderSearchResults(results) {
        const documentsGrid = document.getElementById('documentsGrid');
        if (!documentsGrid) return;
        
        if (results.length === 0) {
            documentsGrid.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>No se encontraron resultados</h3>
                    <p>Intenta con otros términos de búsqueda</p>
                </div>
            `;
            return;
        }
        
        documentsGrid.innerHTML = results.map(doc => `
            <div class="document-card" onclick="portal.viewDocument('${doc.id || doc.titulo}')">
                <div class="document-header">
                    <div class="document-icon">${this.getFileIcon(doc.fileName || doc.ruta)}</div>
                    <div class="document-badge ${doc.tipo === 'uploaded' ? 'uploaded' : 'system'}">
                        ${doc.tipo === 'uploaded' ? '📤 Subido' : '📋 Sistema'}
                    </div>
                </div>
                <div class="document-content">
                    <h3 class="document-title">${doc.titulo}</h3>
                    <p class="document-description">${doc.descripcion || 'Sin descripción'}</p>
                    <div class="document-meta">
                        <span class="document-section">${doc.seccion}</span>
                        ${doc.codigo ? `<span class="document-code">${doc.codigo}</span>` : ''}
                    </div>
                    ${doc.tags ? `
                        <div class="document-tags">
                            ${doc.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="document-actions">
                    <button class="action-btn view-btn" onclick="event.stopPropagation(); portal.viewDocument('${doc.id || doc.titulo}')" title="Ver documento">
                        👁️ Ver
                    </button>
                    <button class="action-btn download-btn" onclick="event.stopPropagation(); portal.downloadDoc('${doc.id || doc.titulo}')" title="Descargar">
                        📥 Descargar
                    </button>
                    ${doc.tipo === 'uploaded' ? `
                        <button class="action-btn delete-btn" onclick="event.stopPropagation(); portal.deleteDocument('${doc.id}')" title="Eliminar">
                            🗑️ Eliminar
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
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

    async handleFile(file) {
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
        
        // Comprimir imagens para melhor performance
        let processedFile = file;
        if (file.type.startsWith('image/') && file.size > 1024 * 1024) { // > 1MB
            console.log('🖼️ Comprimindo imagem...');
            try {
                processedFile = await this.compressImage(file);
                console.log('✅ Imagem comprimida:', file.size, '->', processedFile.size);
            } catch (error) {
                console.warn('⚠️ Erro na compressão, usando arquivo original:', error);
                processedFile = file;
            }
        }
        
        this.showFilePreview(processedFile);
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
        
        // PREVENIR UPLOAD DUPLICADO
        if (this.uploading) {
            console.log('⚠️ Upload já em andamento, ignorando...');
            return;
        }
        this.uploading = true;
        
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
            
            const fileExt = file.name.split('.').pop().toLowerCase();
            const isHtmlFile = ['html', 'htm'].includes(fileExt);
            
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
                fileData: await this.fileToBase64(file),
                isHtmlFile: isHtmlFile
            };

            this.uploadedDocuments.push(doc);
            console.log('📄 Documento adicionado à lista. Total:', this.uploadedDocuments.length);
            
            // Salvar com sistema robusto
            this.saveUploadedDocuments();
            console.log('💾 Salvamento executado. Verificando...');
            
            // VERIFICAÇÃO IMEDIATA
            setTimeout(() => {
                const saved = localStorage.getItem('uploadedDocuments');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    console.log('✅ Verificação: Documentos salvos:', parsed.length);
                } else {
                    console.error('❌ Verificação: Nenhum documento encontrado no localStorage!');
                }
            }, 1000);
            
            // VERIFICAÇÃO DE INTEGRIDADE DESABILITADA (evitar loop)
            console.log('✅ Upload concluído sem verificação de integridade');
            
            this.showToast('Documento subido correctamente', 'success');
            this.hideUpload();
            this.updateStats();
            this.renderRecentDocuments();

            if (this.currentChapter && this.currentChapter.codigo === chapterValue) {
                this.renderDocuments();
            }
            
            console.log('✅ Upload concluído');
        } catch (error) {
            console.error('❌ Erro no upload:', error);
            this.showToast('Error al subir', 'error');
        } finally {
            this.showLoading(false);
            this.uploading = false; // LIBERAR FLAG DE UPLOAD
        }
    }
    
    // Verificar integridade dos dados salvos (DESABILITADA)
    verifyDataIntegrity() {
        console.log('🔍 Verificação de integridade desabilitada para evitar loops');
        return; // FUNÇÃO DESABILITADA
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            // Para arquivos HTML, usar readAsText com UTF-8 para preservar acentos
            if (file.type === 'text/html' || file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm')) {
                reader.readAsText(file, 'UTF-8');
            } else {
            reader.readAsDataURL(file);
            }
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

        // Verificar se é um separador (pasta)
        if (doc.tipo === 'separador') {
            this.showFolderContents(doc);
            return;
        }

        this.currentDocument = doc;
        this.showViewerModal();
    }

    showFolderContents(folderDoc) {
        // Para separadores, mostrar conteúdo da pasta
        const modal = document.getElementById('viewerModal');
        const title = document.getElementById('viewerTitle');
        const frame = document.getElementById('documentFrame');

        if (modal && title && frame) {
            title.textContent = folderDoc.titulo;
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';

            // Criar interface para mostrar conteúdo da pasta
            frame.src = 'about:blank';
            frame.onload = () => {
                const iframeDoc = frame.contentDocument || frame.contentWindow.document;
                if (iframeDoc) {
                    // Buscar arquivos nesta pasta
                    const folderFiles = this.getFilesInFolder(folderDoc.ruta);
                    
                    iframeDoc.body.innerHTML = `
                        <div style="padding: 20px; font-family: Arial, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); min-height: 100vh;">
                            <div style="background: white; padding: 30px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 1000px; margin: 0 auto;">
                                <div style="text-align: center; margin-bottom: 30px;">
                                    <div style="font-size: 3rem; margin-bottom: 15px;">📁</div>
                                    <h2 style="color: #1e3a8a; margin-bottom: 10px; font-size: 1.8rem;">${folderDoc.titulo}</h2>
                                    <p style="color: #64748b; margin-bottom: 20px;">
                                        Pasta para armazenar ensaios de laboratório
                                    </p>
                                </div>
                                
                                <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 30px;">
                                    <p style="margin: 0; color: #475569; font-size: 0.9rem;">
                                        <strong>💡 Como usar:</strong><br>
                                        1. Coloque os arquivos PDF numerados nesta pasta<br>
                                        2. Use nomenclatura: 001_ensaio_tipo.pdf<br>
                                        3. Os documentos aparecerão automaticamente aqui
                                    </p>
                                </div>

                                <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 30px;">
                                    <p style="margin: 0; color: #92400e; font-size: 0.9rem;">
                                        <strong>📂 Pasta:</strong> ${folderDoc.ruta}
                                    </p>
                                </div>

                                <div style="margin-bottom: 30px;">
                                    <h3 style="color: #1e3a8a; margin-bottom: 15px; font-size: 1.2rem;">📄 Arquivos na Pasta (${folderFiles.length})</h3>
                                    ${folderFiles.length > 0 ? `
                                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
                                            ${folderFiles.map(file => `
                                                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 12px;">
                                                    <div style="font-size: 1.5rem;">📄</div>
                                                    <div style="flex: 1;">
                                                        <div style="font-weight: 600; color: #1e3a8a; margin-bottom: 4px;">${file.name}</div>
                                                        <div style="font-size: 0.8rem; color: #64748b;">${file.size || 'Tamanho não disponível'}</div>
                                                    </div>
                                                    <button onclick="window.open('${file.url}', '_blank')" style="background: #3b82f6; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">
                                                        Abrir
                                                    </button>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : `
                                        <div style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 8px; border: 2px dashed #cbd5e1;">
                                            <div style="font-size: 2rem; margin-bottom: 10px;">📭</div>
                                            <p style="color: #64748b; margin: 0;">Nenhum arquivo encontrado nesta pasta</p>
                                            <p style="color: #94a3b8; font-size: 0.9rem; margin: 5px 0 0 0;">Adicione arquivos PDF para vê-los aqui</p>
                                        </div>
                                    `}
                                </div>

                                ${folderDoc.tags ? `
                                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                                        <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 8px;">Tags:</p>
                                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                            ${folderDoc.tags.map(tag => `<span style="background: #e2e8f0; color: #475569; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem;">${tag}</span>`).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }
            };
        }
    }

    getFilesInFolder(folderPath) {
        // Esta função simula a busca de arquivos na pasta
        // Em um sistema real, faria uma requisição ao servidor
        // Por agora, retorna uma lista vazia
        return [];
    }

    showUploadForSubchapter(subchapterName) {
        // Abrir o modal de upload com o capítulo atual pré-selecionado
        this.showUpload();
        
        // Pré-preencher o título com o nome do subcapítulo
        setTimeout(() => {
            const titleInput = document.getElementById('documentTitle');
            if (titleInput) {
                titleInput.value = `${subchapterName} - `;
                titleInput.focus();
                // Posicionar o cursor no final
                titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
            }
            
            // Garantir que o capítulo atual está selecionado
            const chapterSelect = document.getElementById('documentChapter');
            if (chapterSelect && this.currentChapter) {
                chapterSelect.value = this.currentChapter.codigo;
            }
        }, 100);
    }

    async showViewerModal() {
        const modal = document.getElementById('viewerModal');
        const title = document.getElementById('viewerTitle');
        const frame = document.getElementById('documentFrame');

        if (modal && title && frame) {
            title.textContent = this.currentDocument.titulo;
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';

            // Verificar se é documento externo
            if (this.currentDocument.tipo === 'externo' || this.isExternalUrl(this.currentDocument.ruta)) {
                this.showExternalDocument();
                return;
            }

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
                    // Se é um arquivo HTML subido, processar adequadamente
                    if (this.currentDocument.isHtmlFile) {
                        // Para arquivos HTML subidos, criar blob com charset UTF-8
                        const blob = new Blob([this.currentDocument.fileData], { type: 'text/html; charset=utf-8' });
                        frame.src = URL.createObjectURL(blob);
                        
                        // Garantir que o iframe ocupe toda a tela
                        frame.onload = () => {
                            try {
                                const iframeDoc = frame.contentDocument || frame.contentWindow.document;
                                if (iframeDoc) {
                                    // Adicionar CSS para otimizar visualização no iframe
                                    const style = iframeDoc.createElement('style');
                                    style.textContent = `
                                        body {
                                            margin: 0 !important;
                                            padding: 10px !important;
                                            width: 100% !important;
                                            height: 100% !important;
                                            overflow-x: hidden !important;
                                            box-sizing: border-box !important;
                                        }
                                        .container, .main-content, .document-content {
                                            max-width: 100% !important;
                                            width: 100% !important;
                                            margin: 0 !important;
                                            padding: 10px !important;
                                            box-sizing: border-box !important;
                                        }
                                    `;
                                    iframeDoc.head.appendChild(style);
                                }
                            } catch (e) {
                                console.log('Não foi possível modificar o conteúdo do iframe (normal para cross-origin)');
                            }
                        };
                    } else if (this.currentDocument.fileData.startsWith('data:text/html')) {
                    frame.src = this.currentDocument.fileData;
                    } else {
                        // Fallback: criar blob com charset UTF-8
                        const blob = new Blob([this.currentDocument.fileData], { type: 'text/html; charset=utf-8' });
                        frame.src = URL.createObjectURL(blob);
                    }
                } else if (this.currentDocument.ruta) {
                    frame.src = this.currentDocument.ruta;
                }
            }
            // Para PDFs, usar fallback nativo (mais confiável)
            else if (fileExt === 'pdf') {
                console.log('📄 Visualizando PDF:', this.currentDocument.titulo);
                console.log('📄 Dados do arquivo:', this.currentDocument.fileData ? 'Presente' : 'Ausente');
                console.log('📄 Tipo de dados:', typeof this.currentDocument.fileData);
                console.log('📄 Início dos dados:', this.currentDocument.fileData ? this.currentDocument.fileData.substring(0, 100) : 'N/A');
                
                // Usar fallback nativo diretamente (mais confiável que PDF.js)
                console.log('🔄 Usando visualização nativa do navegador...');
                this.renderPDFFallback();
            }
            // Para Excel
            else if (['xls', 'xlsx'].includes(fileExt)) {
                this.renderExcel();
            }
            // Para Word
            else if (['doc', 'docx'].includes(fileExt)) {
                this.renderWord();
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
            
            // Limpar URL de blob se existir
            const frame = document.getElementById('documentFrame');
            if (frame && frame.src && frame.src.startsWith('blob:')) {
                URL.revokeObjectURL(frame.src);
            }
            
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

    editDocument() {
        if (!this.currentDocument) return;
        
        // Para documentos subidos, permitir edição
        if (this.currentDocument.id && this.currentDocument.id.startsWith('uploaded_')) {
            this.showEditModal();
        } else {
            // Para documentos do manifest, mostrar opções
            this.showEditOptions();
        }
    }

    showEditModal() {
        const newTitle = prompt('Editar título do documento:', this.currentDocument.titulo);
        if (newTitle && newTitle.trim() !== '') {
            const newTags = prompt('Editar tags (separadas por vírgula):', this.currentDocument.tags ? this.currentDocument.tags.join(', ') : '');
            
            // Atualizar documento
            this.currentDocument.titulo = newTitle.trim();
            this.currentDocument.tags = newTags ? newTags.split(',').map(t => t.trim()) : [];
            
            // Salvar alterações
            this.saveUploadedDocuments();
            this.showToast('Documento editado com sucesso!', 'success');
            
            // Recarregar vista se necessário
            if (this.currentChapter) {
                this.renderDocuments();
            }
        }
    }

    showEditOptions() {
        const options = [
            '📝 Editar título e tags',
            '📁 Mover para outro capítulo',
            '🗑️ Excluir documento',
            '❌ Cancelar'
        ];
        
        const choice = prompt(`Opções para "${this.currentDocument.titulo}":\n\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nDigite o número da opção:`);
        
        switch(choice) {
            case '1':
                this.editManifestDocument();
                break;
            case '2':
                this.moveDocument();
                break;
            case '3':
                this.deleteManifestDocument();
                break;
            default:
                break;
        }
    }

    editManifestDocument() {
        const newTitle = prompt('Editar título:', this.currentDocument.titulo);
        if (newTitle && newTitle.trim() !== '') {
            this.currentDocument.titulo = newTitle.trim();
            this.showToast('Título editado! (Alteração temporária - faça commit para salvar)', 'info');
        }
    }

    moveDocument() {
        this.showToast('Funcionalidade de mover documento será implementada em breve', 'info');
    }

    deleteManifestDocument() {
        this.showToast('Para excluir documentos do manifest, edite o arquivo data/manifest.json', 'info');
    }

    deleteDocument(docId) {
        let doc = null;
        let isUploaded = false;
        
        // Verificar se é documento subido
        if (docId.startsWith('uploaded_')) {
            doc = this.uploadedDocuments.find(d => d.id === docId);
            isUploaded = true;
        } else {
            // É documento do manifest
            const manifestId = docId.replace('manifest_', '');
            if (this.currentChapter) {
                doc = this.currentChapter.items.find(d => d.titulo === manifestId);
            }
        }
        
        if (!doc) {
            this.showToast('Documento não encontrado', 'error');
            return;
        }

        // Confirmação mais detalhada
        const confirmMessage = `Tem certeza que quer eliminar este documento?\n\n` +
                              `Título: ${doc.titulo}\n` +
                              `Tipo: ${isUploaded ? 'Documento subido' : 'Documento do sistema'}\n` +
                              `${isUploaded ? `Data: ${this.formatDate(doc.uploadDate)}` : `Caminho: ${doc.ruta}`}\n\n` +
                              `Esta ação é IRREVERSÍVEL!`;
        
        if (!confirm(confirmMessage)) {
            console.log('❌ Eliminação cancelada pelo utilizador');
            return;
        }
        
        try {
            if (isUploaded) {
                // Eliminar documento subido
            const index = this.uploadedDocuments.findIndex(d => d.id === docId);
            if (index !== -1) {
                this.uploadedDocuments.splice(index, 1);
                this.saveUploadedDocuments();
                this.showToast(`Documento "${doc.titulo}" eliminado permanentemente!`, 'success');
                this.updateStats();
                }
            } else {
                // Para documentos do manifest, mostrar instruções
                this.showToast('Para eliminar documentos do sistema, edite o arquivo data/manifest.json', 'info');
                return;
            }
                
                // Recarregar a vista atual
                if (this.currentChapter) {
                    this.renderDocuments();
                }
                
                console.log('✅ Documento eliminado:', doc.titulo);
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

    // Storage Robusto - Sistema Otimizado para Grandes Volumes (SEM LOOP)
    saveUploadedDocuments() {
        try {
            const documentsData = JSON.stringify(this.uploadedDocuments);
            const dataSize = new Blob([documentsData]).size;
            console.log(`📊 Tamanho dos dados: ${(dataSize / 1024 / 1024).toFixed(2)} MB`);
            
            // 1. INDEXEDDB (Principal para grandes volumes)
            this.saveToIndexedDB(documentsData);
            
            // 2. LOCALSTORAGE (Apenas metadados para evitar quota)
            try {
                const metadata = this.uploadedDocuments.map(doc => ({
                    id: doc.id,
                    nombre: doc.nombre,
                    fecha: doc.fecha,
                    chapter: doc.chapter,
                    tags: doc.tags
                }));
                localStorage.setItem('uploadedDocuments_metadata', JSON.stringify(metadata));
                console.log('💾 Metadados salvos no localStorage');
            } catch (quotaError) {
                console.warn('⚠️ localStorage cheio, usando apenas IndexedDB');
            }
            
            // 3. BACKUP LIMITADO (apenas 1 backup para evitar quota)
            try {
                localStorage.setItem('documents_backup', documentsData);
                console.log('💾 Backup salvo');
            } catch (quotaError) {
                console.warn('⚠️ Backup não salvo (quota excedida)');
            }
            
            console.log('✅ Sistema de persistência otimizado ativado');
            
            // MONITORAR CAPACIDADE
            this.monitorStorageCapacity();
            
        } catch (error) {
            console.error('❌ Erro ao salvar documentos:', error);
            // Usar apenas IndexedDB em caso de erro
            this.saveToIndexedDB(JSON.stringify(this.uploadedDocuments));
        }
    }
    
    // Salvar no IndexedDB
    async saveToIndexedDB(data) {
        try {
            if ('indexedDB' in window) {
                const request = indexedDB.open('PortalCalidadDB', 1);
                
                request.onupgradeneeded = function(event) {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('documents')) {
                        db.createObjectStore('documents', { keyPath: 'id' });
                    }
                };
                
                request.onsuccess = function(event) {
                    const db = event.target.result;
                    const transaction = db.transaction(['documents'], 'readwrite');
                    const store = transaction.objectStore('documents');
                    
                    const documentRecord = {
                        id: 'all_documents',
                        data: data,
                        timestamp: Date.now()
                    };
                    
                    store.put(documentRecord);
                    console.log('💾 Backup salvo no IndexedDB');
                };
            }
        } catch (error) {
            console.warn('⚠️ IndexedDB não disponível:', error);
        }
    }
    
    // Limpar backups antigos
    cleanOldBackups() {
        try {
            const keys = Object.keys(localStorage);
            const backupKeys = keys.filter(key => key.startsWith('backup_documents_'));
            
            // MANTER MAIS BACKUPS E SER MENOS AGRESSIVO
            if (backupKeys.length > 10) {
                // Ordenar por timestamp e remover apenas os mais antigos
                backupKeys.sort().slice(0, -10).forEach(key => {
                    localStorage.removeItem(key);
                });
                console.log('🧹 Backups antigos limpos, mantidos os 10 mais recentes');
            }
        } catch (error) {
            console.warn('⚠️ Erro ao limpar backups antigos:', error);
        }
    }

    loadUploadedDocuments() {
        try {
            console.log('📂 Carregando documentos salvos...');
            
            // 1. Tentar carregar do localStorage principal
            let storedDocs = localStorage.getItem('uploadedDocuments');
            if (storedDocs) {
                this.uploadedDocuments = JSON.parse(storedDocs);
                console.log('✅ Documentos carregados do localStorage:', this.uploadedDocuments.length);
                return;
            }
            
            // 2. Tentar carregar metadados (para arquivos grandes)
            let metadata = localStorage.getItem('uploadedDocuments_metadata');
            if (metadata) {
                console.log('📋 Metadados encontrados, carregando do IndexedDB...');
                this.loadFromIndexedDB().then(docs => {
                    if (docs && docs.length > 0) {
                        this.uploadedDocuments = docs;
                        console.log('✅ Documentos carregados do IndexedDB:', docs.length);
                        this.renderRecentDocuments();
                    }
                });
                return;
            }
            
            // 2. Tentar carregar do backup principal
            storedDocs = localStorage.getItem('documents_backup');
            if (storedDocs) {
                this.uploadedDocuments = JSON.parse(storedDocs);
                console.log('✅ Documentos carregados do backup principal:', this.uploadedDocuments.length);
                return;
            }
            
            // 3. Tentar carregar dos backups com timestamp
            const keys = Object.keys(localStorage);
            const backupKeys = keys.filter(key => key.startsWith('backup_documents_'));
            if (backupKeys.length > 0) {
                // Pegar o backup mais recente
                backupKeys.sort().reverse();
                const latestBackup = localStorage.getItem(backupKeys[0]);
                if (latestBackup) {
                    this.uploadedDocuments = JSON.parse(latestBackup);
                    console.log('✅ Documentos carregados do backup mais recente:', this.uploadedDocuments.length);
                    return;
                }
            }
            
            // 4. Fallback para sessionStorage
            const sessionDocs = sessionStorage.getItem('uploadedDocuments');
            if (sessionDocs) {
                this.uploadedDocuments = JSON.parse(sessionDocs);
                console.log('✅ Documentos carregados do sessionStorage:', this.uploadedDocuments.length);
                return;
            }
            
            // 5. Tentar carregar do IndexedDB
            this.loadFromIndexedDB().then(docs => {
                if (docs && docs.length > 0) {
                    this.uploadedDocuments = docs;
                    console.log('✅ Documentos carregados do IndexedDB:', docs.length);
                    this.renderRecentDocuments();
                }
            });
            
            // Se não há documentos salvos, inicializar array vazio
            this.uploadedDocuments = [];
            console.log('📝 Nenhum documento salvo encontrado, inicializando array vazio');
            
        } catch (error) {
            console.error('❌ Erro ao carregar documentos:', error);
            this.uploadedDocuments = [];
        }
    }

    // Monitorar capacidade de armazenamento
    monitorStorageCapacity() {
        try {
            // Calcular uso do localStorage
            let localStorageSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    localStorageSize += localStorage[key].length;
                }
            }
            
            const localStorageMB = (localStorageSize / 1024 / 1024).toFixed(2);
            const localStorageLimit = 5; // MB aproximado
            
            console.log(`📊 Capacidade localStorage: ${localStorageMB}MB / ${localStorageLimit}MB`);
            
            if (localStorageMB > localStorageLimit * 0.8) {
                console.warn('⚠️ localStorage próximo do limite!');
                this.showToast(`Armazenamento: ${localStorageMB}MB (${(localStorageMB/localStorageLimit*100).toFixed(0)}%)`, 'warning');
            }
            
            // Verificar IndexedDB
            if ('indexedDB' in window) {
                navigator.storage.estimate().then(estimate => {
                    const usedMB = (estimate.usage / 1024 / 1024).toFixed(2);
                    const quotaMB = (estimate.quota / 1024 / 1024).toFixed(2);
                    console.log(`📊 IndexedDB: ${usedMB}MB / ${quotaMB}MB`);
                    
                    if (estimate.usage / estimate.quota > 0.8) {
                        console.warn('⚠️ IndexedDB próximo do limite!');
                        this.showToast(`IndexedDB: ${usedMB}MB (${(estimate.usage/estimate.quota*100).toFixed(0)}%)`, 'warning');
                    }
                });
            }
            
        } catch (error) {
            console.warn('⚠️ Erro ao monitorar capacidade:', error);
        }
    }

    
    // Carregar do IndexedDB
    async loadFromIndexedDB() {
        try {
            if ('indexedDB' in window) {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open('PortalCalidadDB', 1);
                    
                    request.onsuccess = function(event) {
                        const db = event.target.result;
                        const transaction = db.transaction(['documents'], 'readonly');
                        const store = transaction.objectStore('documents');
                        const getRequest = store.get('all_documents');
                        
                        getRequest.onsuccess = function() {
                            if (getRequest.result && getRequest.result.data) {
                                const docs = JSON.parse(getRequest.result.data);
                                resolve(docs);
                            } else {
                                resolve([]);
                            }
                        };
                        
                        getRequest.onerror = function() {
                            resolve([]);
                        };
                    };
                    
                    request.onerror = function() {
                        resolve([]);
                    };
                });
            }
        } catch (error) {
            console.warn('⚠️ Erro ao carregar do IndexedDB:', error);
            return [];
        }
    }

    renderRecentDocuments() {
        const container = document.getElementById('recentDocsList');
        if (!container) return;

        // Obter histórico de visualizações (sem repetições)
        const viewHistory = this.getViewHistory();
        
        if (viewHistory.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <p>No hay documentos recientes</p>
                    <small>Los documentos subidos aparecerán aquí</small>
                </div>
            `;
            return;
        }

        // Buscar documentos únicos do histórico
        const recentDocs = viewHistory
            .map(historyItem => {
                // Procurar nos documentos subidos
                let doc = this.uploadedDocuments.find(d => d.id === historyItem.docId);
                
                if (doc) {
                    return { ...doc, lastViewed: historyItem.timestamp };
                }
                
                // Procurar no manifest
                if (this.manifest && this.manifest.secciones) {
                    for (const section of this.manifest.secciones) {
                        if (section.documentos) {
                            for (const manifestDoc of section.documentos) {
                                const manifestDocId = 'manifest_' + manifestDoc.titulo;
                                if (manifestDocId === historyItem.docId) {
                                    return {
                                        ...manifestDoc,
                                        id: manifestDocId,
                                        chapter: section.codigo,
                                        lastViewed: historyItem.timestamp
                                    };
                                }
                            }
                        }
                    }
                }
                
                return null;
            })
            .filter(doc => doc !== null)
            .sort((a, b) => new Date(b.lastViewed) - new Date(a.lastViewed))
            .slice(0, 6); // Mostrar apenas os 6 mais recentes

        if (recentDocs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <p>No hay documentos recientes</p>
                    <small>Los documentos subidos aparecerán aquí</small>
                </div>
            `;
            return;
        }

        container.innerHTML = recentDocs.map(doc => this.createRecentDocCard(doc)).join('');
    }

    createRecentDocCard(doc) {
        const fileExt = this.getFileExtension(doc.fileName || doc.ruta);
        const fileIcon = this.getFileIcon(doc.fileName || doc.ruta);
        
        // Usar data da última visualização se disponível, senão usar data de upload
        const viewDate = doc.lastViewed ? new Date(doc.lastViewed) : new Date(doc.uploadDate || doc.fecha);
        const formattedDate = viewDate.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const formattedTime = viewDate.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="recent-doc-card">
                <div class="recent-doc-header">
                    <div class="recent-doc-icon">${fileIcon}</div>
                    <div class="recent-doc-info">
                        <div class="recent-doc-title">${doc.titulo}</div>
                        <div class="recent-doc-meta">
                            <span>👁️ ${formattedDate}</span>
                            <span>🕒 ${formattedTime}</span>
                            <span>📂 Cap. ${doc.chapter || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div class="recent-doc-actions">
                    <button class="btn-view" onclick="portal.showViewer('${doc.id}')" title="Ver documento">
                        <span>👁️</span>
                        <span>Ver</span>
                    </button>
                    <button class="btn-delete" onclick="portal.deleteDocument('${doc.id}')" title="Eliminar">
                        <span>🗑️</span>
                        <span>Eliminar</span>
                    </button>
                </div>
            </div>
        `;
    }

    refreshRecentDocuments() {
        this.renderRecentDocuments();
        this.showToast('Documentos recientes actualizados', 'success');
    }

    renderFavorites() {
        const container = document.getElementById('favoriteDocsList');
        if (!container) return;

        const favoriteDocs = this.getFavoriteDocuments();

        if (favoriteDocs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⭐</div>
                    <p>No hay documentos favoritos</p>
                    <small>Haz clic en la estrella de un documento para añadirlo a favoritos</small>
                </div>
            `;
            return;
        }

        container.innerHTML = favoriteDocs.map(doc => this.createDocumentCard(doc)).join('');
    }

    refreshFavorites() {
        this.renderFavorites();
        this.showToast('Favoritos actualizados', 'success');
    }

    clearAllFavorites() {
        if (confirm('¿Estás seguro de que quieres eliminar todos los favoritos?')) {
            this.saveFavorites([]);
            this.renderFavorites();
            this.updateStats();
            this.showToast('Todos los favoritos han sido eliminados', 'info');
        }
    }

    showViewer(docId) {
        // Procurar documento nos subidos
        let doc = this.uploadedDocuments.find(d => d.id === docId);
        
        if (doc) {
            this.currentDocument = doc;
            this.addToViewHistory(docId);
            this.showViewerModal();
            return;
        }
        
        // Procurar documento no manifest
        if (this.manifest && this.manifest.secciones) {
            for (const section of this.manifest.secciones) {
                // Procurar em section.items (documentos principais)
                if (section.items) {
                    for (const manifestDoc of section.items) {
                        const manifestDocId = 'manifest_' + manifestDoc.nombre;
                        if (manifestDocId === docId) {
                            this.currentDocument = {
                                ...manifestDoc,
                                titulo: manifestDoc.nombre,
                                id: manifestDocId,
                                chapter: section.codigo
                            };
                            this.addToViewHistory(docId);
                            this.showViewerModal();
                            return;
                        }
                    }
                }
                
                // Procurar em subcapítulos
                if (section.subcapitulos) {
                    for (const subchapter of section.subcapitulos) {
                        if (subchapter.items) {
                            for (const manifestDoc of subchapter.items) {
                                const manifestDocId = 'manifest_' + manifestDoc.nombre;
                                if (manifestDocId === docId) {
                                    this.currentDocument = {
                                        ...manifestDoc,
                                        titulo: manifestDoc.nombre,
                                        id: manifestDocId,
                                        chapter: section.codigo,
                                        subchapter: subchapter.codigo
                                    };
                                    this.addToViewHistory(docId);
                                    this.showViewerModal();
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Se não encontrou, mostrar erro
        this.showToast('Documento não encontrado', 'error');
        console.error('Documento não encontrado:', docId);
    }

    // ===== HISTÓRICO DE VISUALIZAÇÕES =====
    
    getViewHistory() {
        try {
            const history = localStorage.getItem('portal_view_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            return [];
        }
    }

    saveViewHistory(history) {
        try {
            localStorage.setItem('portal_view_history', JSON.stringify(history));
        } catch (error) {
            console.error('Erro ao salvar histórico:', error);
        }
    }

    addToViewHistory(docId) {
        const history = this.getViewHistory();
        const now = new Date().toISOString();
        
        // Remover se já existe (para evitar duplicatas)
        const existingIndex = history.findIndex(item => item.docId === docId);
        if (existingIndex > -1) {
            history.splice(existingIndex, 1);
        }
        
        // Adicionar no início da lista
        history.unshift({
            docId: docId,
            timestamp: now
        });
        
        // Manter apenas os últimos 20 visualizações
        const limitedHistory = history.slice(0, 20);
        
        this.saveViewHistory(limitedHistory);
        
        // Atualizar a seção de documentos recentes
        this.renderRecentDocuments();
    }

    clearViewHistory() {
        if (confirm('¿Estás seguro de que quieres limpiar el historial de visualizaciones?')) {
            this.saveViewHistory([]);
            this.renderRecentDocuments();
            this.showToast('Historial de visualizaciones limpiado', 'info');
        }
    }


    updateStats() {
        const total = this.getTotalDocumentCount();
        const uploaded = this.uploadedDocuments.length;
        const recent = this.getRecentDocumentCount();

        // Calcular estatísticas dinâmicas dos capítulos e subcapítulos
        const chapterStats = this.calculateChapterStats();

        const totalDocuments = document.getElementById('totalDocuments');
        const uploadedDocuments = document.getElementById('uploadedDocuments');
        const recentDocuments = document.getElementById('recentDocuments');
        const totalDocs = document.getElementById('totalDocs');
        const uploadedDocs = document.getElementById('uploadedDocs');
        const filledChapters = document.getElementById('filledChapters');
        const completionRate = document.getElementById('completionRate');
        const chapterCount = document.getElementById('chapterCount');
        const totalChapters = document.getElementById('totalChapters');
        const totalSubchapters = document.getElementById('totalSubchapters');

        // Atualizar contadores básicos
        if (totalDocuments) totalDocuments.textContent = total;
        if (uploadedDocuments) uploadedDocuments.textContent = uploaded;
        if (recentDocuments) recentDocuments.textContent = recent;
        if (totalDocs) totalDocs.textContent = total;
        if (uploadedDocs) uploadedDocs.textContent = uploaded;

        // Atualizar contador de capítulos no sidebar
        if (chapterCount) {
            chapterCount.textContent = `${chapterStats.totalChapters} capítulos`;
        }

        // Atualizar contadores de capítulos e subcapítulos no dashboard
        if (totalChapters) {
            totalChapters.textContent = chapterStats.totalChapters;
        }
        if (totalSubchapters) {
            totalSubchapters.textContent = chapterStats.totalSubchapters;
        }

        // Novos indicadores melhorados
        if (filledChapters) {
            filledChapters.textContent = chapterStats.chaptersWithDocuments;
        }
        
        if (completionRate) {
            const rate = chapterStats.totalChapters > 0 ? 
                Math.round((chapterStats.chaptersWithDocuments / chapterStats.totalChapters) * 100) : 0;
            completionRate.textContent = rate + '%';
        }

        // Log das estatísticas para debug
        console.log('📊 Estatísticas atualizadas:', {
            totalChapters: chapterStats.totalChapters,
            totalSubchapters: chapterStats.totalSubchapters,
            chaptersWithDocuments: chapterStats.chaptersWithDocuments,
            uploadedDocuments: uploaded
        });

        // Atualizar cronograma do projeto
        this.updateProjectTimeline();

        // Atualizar lista de documentos recentes
        this.updateRecentDocumentsList();
    }

    // Nova função para calcular estatísticas dos capítulos
    calculateChapterStats() {
        if (!this.manifest || !this.manifest.secciones) {
            return {
                totalChapters: 0,
                totalSubchapters: 0,
                chaptersWithDocuments: 0,
                chaptersWithSubchapters: 0
            };
        }

        const sections = this.manifest.secciones;
        let totalSubchapters = 0;
        let chaptersWithDocuments = 0;
        let chaptersWithSubchapters = 0;

        sections.forEach(section => {
            // Contar subcapítulos
            if (section.subcapitulos && section.subcapitulos.length > 0) {
                totalSubchapters += section.subcapitulos.length;
                chaptersWithSubchapters++;
            }

            // Verificar se tem documentos (no manifest ou subidos)
            const hasManifestDocs = section.documentos && section.documentos.length > 0;
            const hasUploadedDocs = this.uploadedDocuments.some(doc => doc.chapter === section.codigo);
            
            if (hasManifestDocs || hasUploadedDocs) {
                chaptersWithDocuments++;
            }
        });

        return {
            totalChapters: sections.length,
            totalSubchapters: totalSubchapters,
            chaptersWithDocuments: chaptersWithDocuments,
            chaptersWithSubchapters: chaptersWithSubchapters
        };
    }

    updateProjectTimeline() {
        console.log('📅 Atualizando cronograma do projeto...');
        
        // Data de início: Fevereiro 2025
        const startDate = new Date('2025-02-01');
        const currentDate = new Date();
        
        console.log('📅 Data início:', startDate.toLocaleDateString());
        console.log('📅 Data atual:', currentDate.toLocaleDateString());
        
        // Calcular meses decorridos (mais preciso)
        const monthsElapsed = this.getMonthsDifference(startDate, currentDate);
        console.log('📅 Meses decorridos:', monthsElapsed);
        
        // Duração legal: 37 meses, Prática: até 50 meses
        const legalDuration = 37;
        const maxDuration = 50;
        
        // Calcular progresso baseado na duração legal (37 meses)
        const progressPercentage = Math.min(Math.round((monthsElapsed / legalDuration) * 100), 100);
        console.log('📅 Progresso calculado:', progressPercentage + '%');
        
        // Data estimada de finalização (baseada nos 37 meses legais)
        const estimatedEndDate = new Date(startDate);
        estimatedEndDate.setMonth(estimatedEndDate.getMonth() + legalDuration);
        
        // Verificar se passou do prazo legal
        const isOverLegalTime = monthsElapsed > legalDuration;
        
        console.log('📅 Passou do prazo legal:', isOverLegalTime);
        
        // Atualizar elementos da interface
        this.updateTimelineElements(monthsElapsed, progressPercentage, estimatedEndDate, isOverLegalTime, legalDuration, maxDuration);
    }

    getMonthsDifference(startDate, endDate) {
        const yearDiff = endDate.getFullYear() - startDate.getFullYear();
        const monthDiff = endDate.getMonth() - startDate.getMonth();
        const dayDiff = endDate.getDate() - startDate.getDate();
        
        // Calcular meses mais precisos considerando os dias
        let months = yearDiff * 12 + monthDiff;
        if (dayDiff > 0) {
            months += 0.5; // Se passou mais da metade do mês, conta meio mês
        }
        
        return Math.round(months * 10) / 10; // Arredondar para 1 casa decimal
    }

    updateTimelineElements(monthsElapsed, progressPercentage, estimatedEndDate, isOverLegalTime, legalDuration, maxDuration) {
        // Atualizar data atual
        const currentDateElement = document.getElementById('currentDate');
        if (currentDateElement) {
            const now = new Date();
            const options = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
            };
            currentDateElement.textContent = now.toLocaleDateString('es-ES', options);
        }

        // Atualizar data estimada de finalização
        const estimatedEndElement = document.getElementById('estimatedEnd');
        if (estimatedEndElement) {
            const options = { year: 'numeric', month: 'long' };
            estimatedEndElement.textContent = estimatedEndDate.toLocaleDateString('es-ES', options);
        }

        // Atualizar porcentagem de progresso
        const progressPercentageElement = document.getElementById('progressPercentage');
        if (progressPercentageElement) {
            progressPercentageElement.textContent = progressPercentage + '%';
            
            // Mudar cor se passou do prazo legal
            if (isOverLegalTime) {
                progressPercentageElement.style.color = 'var(--error)';
                progressPercentageElement.style.fontWeight = '700';
            } else {
                progressPercentageElement.style.color = 'var(--primary)';
                progressPercentageElement.style.fontWeight = '600';
            }
        }

        // Atualizar barra de progresso (compacta)
        const progressFillElement = document.getElementById('progressFill');
        if (progressFillElement) {
            progressFillElement.style.width = progressPercentage + '%';
            
            // Mudar cor da barra se passou do prazo legal
            if (isOverLegalTime) {
                progressFillElement.style.background = 'var(--gradient-error)';
            } else {
                progressFillElement.style.background = 'var(--gradient-primary)';
            }
        }

        // Atualizar mês atual no milestone
        const currentMonthElement = document.getElementById('currentMonth');
        if (currentMonthElement) {
            const now = new Date();
            const options = { year: 'numeric', month: 'short' };
            currentMonthElement.textContent = now.toLocaleDateString('es-ES', options);
        }

        // Atualizar meses decorridos com informação mais detalhada
        const monthsElapsedElement = document.getElementById('monthsElapsed');
        if (monthsElapsedElement) {
            let statusText = '';
            if (isOverLegalTime) {
                const monthsOver = monthsElapsed - legalDuration;
                statusText = `${monthsElapsed} meses (${monthsOver} meses sobre prazo legal)`;
                monthsElapsedElement.style.color = 'var(--error)';
                monthsElapsedElement.style.fontWeight = '700';
            } else {
                const monthsRemaining = legalDuration - monthsElapsed;
                statusText = `${monthsElapsed} meses (${monthsRemaining} meses restantes)`;
                monthsElapsedElement.style.color = 'var(--primary)';
                monthsElapsedElement.style.fontWeight = '600';
            }
            monthsElapsedElement.textContent = statusText;
        }

        // Atualizar texto de referência
        const progressDetails = document.querySelector('.progress-stats .progress-reference');
        if (progressDetails) {
            if (isOverLegalTime) {
                progressDetails.textContent = `de ${legalDuration} legales (máx. ${maxDuration})`;
                progressDetails.style.color = 'var(--error)';
            } else {
                progressDetails.textContent = `de ${legalDuration} legales (máx. ${maxDuration})`;
                progressDetails.style.color = 'var(--gray-600)';
            }
        }

        console.log(`📊 Progresso: ${monthsElapsed} meses de ${legalDuration} legales (${progressPercentage}%) - ${isOverLegalTime ? 'SOBRE PRAZO' : 'DENTRO DO PRAZO'}`);
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

        // Adicionar animação de entrada
        setTimeout(() => {
            toast.classList.add('show');
            toast.classList.add('bounce');
        }, 100);
        
        // Remover bounce após animação
        setTimeout(() => toast.classList.remove('bounce'), 1000);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    // Função para adicionar novo arquivo HTML ao manifest (para desenvolvedores)
    addHtmlToManifest(chapterCode, title, filePath, tags = [], description = '') {
        console.log(`📝 Adicionando arquivo HTML ao capítulo ${chapterCode}:`, title);
        
        if (!this.manifest) {
            console.error('❌ Manifest não carregado');
            return false;
        }
        
        const chapter = this.manifest.secciones.find(sec => sec.codigo === chapterCode);
        if (!chapter) {
            console.error(`❌ Capítulo ${chapterCode} não encontrado`);
            return false;
        }
        
        const newItem = {
            titulo: title,
            ruta: filePath,
            tags: tags,
            fecha: new Date().toISOString().split('T')[0],
            estado: 'Aprobado',
            descripcion: description
        };
        
        chapter.items.push(newItem);
        console.log('✅ Arquivo adicionado ao manifest:', newItem);
        
        // Recarregar a vista se estivermos no capítulo correto
        if (this.currentChapter && this.currentChapter.codigo === chapterCode) {
            this.renderDocuments();
        }
        
        return true;
    }

    // ===== SISTEMA DE AUTENTICAÇÃO =====
    
    checkAuthentication() {
        // Verificar se há sessão ativa
        const sessionAuth = sessionStorage.getItem('portal_authenticated');
        if (sessionAuth === 'true') {
            this.isAuthenticated = true;
            console.log('✅ Usuário já autenticado');
        }
    }

    showLoginModal() {
        console.log('🔐 Mostrando modal de login');
        document.body.classList.add('login-active');
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Focar no campo de senha
            setTimeout(() => {
                const passwordInput = document.getElementById('passwordInput');
                if (passwordInput) {
                    passwordInput.focus();
                }
            }, 100);
            
            // Permitir login com Enter
            const passwordInput = document.getElementById('passwordInput');
            if (passwordInput) {
                passwordInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleLogin();
                    }
                });
            }
        }
    }

    hideLoginModal() {
        console.log('✅ Escondendo modal de login');
        document.body.classList.remove('login-active');
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    handleLogin() {
        const passwordInput = document.getElementById('passwordInput');
        const errorDiv = document.getElementById('loginError');
        
        if (!passwordInput) return;
        
        const password = passwordInput.value.trim();
        
        if (this.validPasswords.includes(password)) {
            // Senha correta
            this.isAuthenticated = true;
            sessionStorage.setItem('portal_authenticated', 'true');
            
            // Esconder erro se existir
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
            
            // Esconder modal e inicializar sistema
            this.hideLoginModal();
            this.initializeAfterLogin();
            
            console.log('✅ Login bem-sucedido');
        } else {
            // Senha incorreta
            if (errorDiv) {
                errorDiv.style.display = 'flex';
            }
            
            // Limpar campo e focar novamente
            passwordInput.value = '';
            passwordInput.focus();
            
            console.log('❌ Senha incorreta');
        }
    }

    async initializeAfterLogin() {
        try {
            await this.loadManifest();
            this.setupEvents();
            this.renderChapters();
            this.updateStats();
            this.loadUploadedDocuments();
            this.renderFavorites();
            this.setupLazyLoading(); // Inicializar lazy loading
            
            // Garantir que a barra lateral está visível na inicialização
            this.ensureSidebarVisible();
            
            // Melhorar ícones de pasta automaticamente
            setTimeout(() => this.enhanceFolderIcons(), 500);
            
            console.log('✅ Sistema inicializado após login');
        } catch (error) {
            console.error('❌ Erro ao inicializar após login:', error);
            this.showToast('Erro ao carregar sistema', 'error');
        }
    }

    togglePassword() {
        const passwordInput = document.getElementById('passwordInput');
        const toggleIcon = document.querySelector('.toggle-icon');
        
        if (passwordInput && toggleIcon) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                toggleIcon.textContent = '👁️';
            }
        }
    }

    logout() {
        this.isAuthenticated = false;
        sessionStorage.removeItem('portal_authenticated');
        this.showLoginModal();
        console.log('🚪 Logout realizado');
    }

    // ===== SISTEMA DE FAVORITOS =====
    
    isFavorite(docId) {
        const favorites = this.getFavorites();
        return favorites.includes(docId);
    }

    getFavorites() {
        try {
            const favorites = localStorage.getItem('portal_favorites');
            return favorites ? JSON.parse(favorites) : [];
        } catch (error) {
            console.error('Erro ao carregar favoritos:', error);
            return [];
        }
    }

    saveFavorites(favorites) {
        try {
            localStorage.setItem('portal_favorites', JSON.stringify(favorites));
        } catch (error) {
            console.error('Erro ao salvar favoritos:', error);
        }
    }

    toggleFavorite(docId) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(docId);
        
        if (index > -1) {
            // Remover dos favoritos
            favorites.splice(index, 1);
            this.showToast('Removido dos favoritos', 'info');
        } else {
            // Adicionar aos favoritos
            favorites.push(docId);
            this.showToast('Adicionado aos favoritos', 'success');
        }
        
        this.saveFavorites(favorites);
        
        // Atualizar a interface
        this.updateFavoriteUI(docId);
        this.updateStats();
        
        // Atualizar a seção de favoritos no dashboard
        this.renderFavorites();
    }

    updateFavoriteUI(docId) {
        const card = document.querySelector(`[data-doc-id="${docId}"]`);
        if (!card) return;

        const isFavorite = this.isFavorite(docId);
        const favoriteBtn = card.querySelector('.favorite-btn');
        const favoriteIcon = card.querySelector('.favorite-icon');
        
        if (favoriteBtn && favoriteIcon) {
            favoriteBtn.classList.toggle('active', isFavorite);
            favoriteIcon.textContent = isFavorite ? '⭐' : '☆';
            favoriteBtn.title = isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos';
        }
        
        // Atualizar classe do card
        card.classList.toggle('favorite', isFavorite);
    }

    getFavoriteDocuments() {
        const favorites = this.getFavorites();
        const allDocs = [];
        
        // Adicionar documentos do manifest
        if (this.manifest && this.manifest.secciones) {
            this.manifest.secciones.forEach(sec => {
                if (sec.documentos) {
                    sec.documentos.forEach(doc => {
                        const docId = 'manifest_' + doc.titulo;
                        if (favorites.includes(docId)) {
                            allDocs.push({...doc, id: docId, chapter: sec.codigo});
                        }
                    });
                }
            });
        }
        
        // Adicionar documentos subidos
        this.uploadedDocuments.forEach(doc => {
            if (favorites.includes(doc.id)) {
                allDocs.push(doc);
            }
        });
        
        return allDocs;
    }

    async renderPDF() {
        const frame = document.getElementById('documentFrame');
        
        try {
            // Configurar PDF.js
            if (typeof pdfjsLib !== 'undefined') {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                
                let pdfData;
                if (this.currentDocument.fileData.startsWith('data:application/pdf')) {
                    pdfData = this.currentDocument.fileData;
                } else {
                    // Converter Base64 para Uint8Array
                    const base64Data = this.currentDocument.fileData.replace(/^data:application\/pdf;base64,/, '');
                    const binaryData = atob(base64Data);
                    const bytes = new Uint8Array(binaryData.length);
                    for (let i = 0; i < binaryData.length; i++) {
                        bytes[i] = binaryData.charCodeAt(i);
                    }
                    pdfData = bytes;
                }
                
                const pdf = await pdfjsLib.getDocument(pdfData).promise;
                const numPages = pdf.numPages;
                
                // Renderizar primeira página
                const page = await pdf.getPage(1);
                const scale = 1.5;
                const viewport = page.getViewport({ scale });
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                
                await page.render(renderContext).promise;
                
                frame.src = 'about:blank';
                frame.onload = () => {
                    const iframeDoc = frame.contentDocument || frame.contentWindow.document;
                    iframeDoc.body.innerHTML = `
                        <div style="padding: 20px; font-family: Arial, sans-serif; background: white; min-height: 100vh;">
                            <h2 style="color: #dc3545; margin-bottom: 20px; text-align: center;">📄 ${this.currentDocument.titulo}</h2>
                            <div style="text-align: center; margin-bottom: 15px;">
                                <span style="background: #f8f9fa; padding: 5px 10px; border-radius: 15px; font-size: 0.9em; color: #6c757d;">
                                    Página 1 de ${numPages}
                                </span>
                            </div>
                            <div style="text-align: center; margin: 20px 0;">
                                <div style="border: 2px solid #ddd; border-radius: 8px; overflow: hidden; display: inline-block; box-shadow: 0 4px 8px rgba(0,0,0,0.1); background: white;">
                                    ${canvas.outerHTML}
                                </div>
                            </div>
                            <div style="margin-top: 15px; text-align: center;">
                                <button onclick="portal.downloadDoc()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
                                    📥 Baixar PDF
                                </button>
                            </div>
                        </div>
                    `;
                    console.log('✅ PDF renderizado no iframe com sucesso');
                };
            } else {
                // Fallback para visualização nativa do navegador
                if (this.currentDocument.fileData.startsWith('data:application/pdf')) {
                    frame.src = this.currentDocument.fileData;
                } else {
                    const base64Data = this.currentDocument.fileData.replace(/^data:application\/pdf;base64,/, '');
                    const binaryData = atob(base64Data);
                    const bytes = new Uint8Array(binaryData.length);
                    for (let i = 0; i < binaryData.length; i++) {
                        bytes[i] = binaryData.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: 'application/pdf' });
                    frame.src = URL.createObjectURL(blob);
                }
            }
        } catch (error) {
            console.error('Erro ao renderizar PDF:', error);
            frame.src = 'about:blank';
            frame.onload = () => {
                frame.contentDocument.body.innerHTML = `
                    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
                        <h2>❌ Erro ao carregar PDF</h2>
                        <p>Não foi possível visualizar este documento PDF.</p>
                        <button onclick="portal.downloadDoc()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            📥 Baixar PDF
                        </button>
                    </div>
                `;
            };
        }
    }

    async renderExcel() {
        const frame = document.getElementById('documentFrame');
        
        try {
            if (typeof XLSX !== 'undefined') {
                let workbook;
                
                if (this.currentDocument.fileData.startsWith('data:')) {
                    // Se for data URL, converter para ArrayBuffer
                    const base64Data = this.currentDocument.fileData.split(',')[1];
                    const binaryData = atob(base64Data);
                    const bytes = new Uint8Array(binaryData.length);
                    for (let i = 0; i < binaryData.length; i++) {
                        bytes[i] = binaryData.charCodeAt(i);
                    }
                    workbook = XLSX.read(bytes, { type: 'array' });
                } else {
                    workbook = XLSX.read(this.currentDocument.fileData, { type: 'binary' });
                }
                
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const html = XLSX.utils.sheet_to_html(worksheet);
                
                frame.src = 'about:blank';
                frame.onload = () => {
                    frame.contentDocument.body.innerHTML = `
                        <div style="padding: 20px; font-family: Arial, sans-serif;">
                            <h2 style="color: #28a745; margin-bottom: 20px;">📊 ${this.currentDocument.titulo}</h2>
                            <div style="background: white; border-radius: 8px; overflow: auto; max-height: 80vh; border: 1px solid #ddd; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                                ${html}
                            </div>
                            <div style="margin-top: 15px; text-align: center;">
                                <button onclick="portal.downloadDoc()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
                                    📥 Baixar Excel
                                </button>
                            </div>
                        </div>
                    `;
                };
            } else {
                throw new Error('XLSX não carregado');
            }
        } catch (error) {
            console.error('Erro ao renderizar Excel:', error);
            frame.src = 'about:blank';
            frame.onload = () => {
                frame.contentDocument.body.innerHTML = `
                    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
                        <h2>❌ Erro ao carregar Excel</h2>
                        <p>Não foi possível visualizar este arquivo Excel.</p>
                        <button onclick="portal.downloadDoc()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            📥 Baixar Arquivo
                        </button>
                    </div>
                `;
            };
        }
    }

    async renderWord() {
        const frame = document.getElementById('documentFrame');
        
        try {
            if (typeof mammoth !== 'undefined') {
                let arrayBuffer;
                
                if (this.currentDocument.fileData.startsWith('data:')) {
                    // Converter data URL para ArrayBuffer
                    const base64Data = this.currentDocument.fileData.split(',')[1];
                    const binaryData = atob(base64Data);
                    const bytes = new Uint8Array(binaryData.length);
                    for (let i = 0; i < binaryData.length; i++) {
                        bytes[i] = binaryData.charCodeAt(i);
                    }
                    arrayBuffer = bytes.buffer;
                } else {
                    // Converter string para ArrayBuffer
                    const binaryData = atob(this.currentDocument.fileData);
                    const bytes = new Uint8Array(binaryData.length);
                    for (let i = 0; i < binaryData.length; i++) {
                        bytes[i] = binaryData.charCodeAt(i);
                    }
                    arrayBuffer = bytes.buffer;
                }
                
                const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                const html = result.value;
                const messages = result.messages;
                
                frame.src = 'about:blank';
                frame.onload = () => {
                    frame.contentDocument.body.innerHTML = `
                        <div style="padding: 20px; font-family: Arial, sans-serif;">
                            <h2 style="color: #007bff; margin-bottom: 20px;">📝 ${this.currentDocument.titulo}</h2>
                            ${messages.length > 0 ? `
                                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 10px; margin-bottom: 15px;">
                                    <strong>⚠️ Avisos:</strong>
                                    <ul style="margin: 5px 0;">
                                        ${messages.map(msg => `<li>${msg.message}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #ddd; box-shadow: 0 4px 8px rgba(0,0,0,0.1); line-height: 1.6;">
                                ${html}
                            </div>
                            <div style="margin-top: 15px; text-align: center;">
                                <button onclick="portal.downloadDoc()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
                                    📥 Baixar Word
                                </button>
                            </div>
                        </div>
                    `;
                };
            } else {
                throw new Error('Mammoth não carregado');
            }
        } catch (error) {
            console.error('Erro ao renderizar Word:', error);
            frame.src = 'about:blank';
            frame.onload = () => {
                frame.contentDocument.body.innerHTML = `
                    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
                        <h2>❌ Erro ao carregar Word</h2>
                        <p>Não foi possível visualizar este arquivo Word.</p>
                        <button onclick="portal.downloadDoc()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            📥 Baixar Arquivo
                        </button>
                    </div>
                `;
            };
        }
    }
    // ===== BUSCA AVANÇADA =====
    
    showAdvancedSearch() {
        console.log('🔍 Abrindo busca avançada...');
        const modal = document.getElementById('advancedSearchModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.populateChapterFilter();
            this.populateAdvancedSearchInput();
        }
    }

    hideAdvancedSearch() {
        console.log('🔍 Fechando busca avançada...');
        const modal = document.getElementById('advancedSearchModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    populateChapterFilter() {
        const chapterFilter = document.getElementById('chapterFilter');
        if (!chapterFilter || !this.manifest) return;

        // Limpar opções existentes (exceto a primeira)
        while (chapterFilter.children.length > 1) {
            chapterFilter.removeChild(chapterFilter.lastChild);
        }

        // Adicionar opções dos capítulos
        this.manifest.secciones.forEach(section => {
            const option = document.createElement('option');
            option.value = section.codigo;
            option.textContent = `${section.codigo} - ${section.titulo}`;
            chapterFilter.appendChild(option);
        });
    }

    populateAdvancedSearchInput() {
        const searchInput = document.getElementById('searchInput');
        const advancedSearchInput = document.getElementById('advancedSearchInput');
        
        if (searchInput && advancedSearchInput && searchInput.value) {
            advancedSearchInput.value = searchInput.value;
        }
    }

    clearAdvancedFilters() {
        console.log('🗑️ Limpando filtros avançados...');
        
        // Limpar campo de busca
        const advancedSearchInput = document.getElementById('advancedSearchInput');
        if (advancedSearchInput) advancedSearchInput.value = '';

        // Limpar todos os filtros
        const filters = [
            'typeFilter', 'chapterFilter', 'statusFilter', 
            'dateFilter', 'favoritesFilter', 'sizeFilter'
        ];
        
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) filter.value = '';
        });

        // Resetar ordenação
        const sortBy = document.getElementById('sortBy');
        const sortOrder = document.getElementById('sortOrder');
        if (sortBy) sortBy.value = 'relevance';
        if (sortOrder) sortOrder.value = 'desc';

        // Esconder resultados
        const results = document.getElementById('advancedSearchResults');
        if (results) {
            results.classList.remove('visible');
            results.style.display = 'none';
        }

        this.showToast('Filtros limpos com sucesso!', 'success');
    }

    executeAdvancedSearch() {
        console.log('🔍 Executando busca avançada...');
        
        try {
            // Coletar critérios de busca
            const searchCriteria = this.collectSearchCriteria();
            console.log('🔍 Critérios coletados:', searchCriteria);
            
            // Executar busca
            const results = this.performAdvancedSearch(searchCriteria);
            console.log('🔍 Resultados encontrados:', results.length);
            
            // Exibir resultados
            this.displayAdvancedSearchResults(results);
            
            // Mostrar toast de sucesso
            if (results.length > 0) {
                this.showToast(`${results.length} resultado${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}!`, 'success');
            } else {
                this.showToast('Nenhum resultado encontrado. Tente ajustar os filtros.', 'warning');
            }
        } catch (error) {
            console.error('❌ Erro na busca avançada:', error);
            this.showToast('Erro ao executar busca. Tente novamente.', 'error');
        }
    }

    collectSearchCriteria() {
        return {
            text: document.getElementById('advancedSearchInput')?.value || '',
            type: document.getElementById('typeFilter')?.value || '',
            chapter: document.getElementById('chapterFilter')?.value || '',
            status: document.getElementById('statusFilter')?.value || '',
            date: document.getElementById('dateFilter')?.value || '',
            favorites: document.getElementById('favoritesFilter')?.value || '',
            size: document.getElementById('sizeFilter')?.value || '',
            sortBy: document.getElementById('sortBy')?.value || 'relevance',
            sortOrder: document.getElementById('sortOrder')?.value || 'desc'
        };
    }

    performAdvancedSearch(criteria) {
        console.log('🔍 Critérios de busca:', criteria);
        
        let allDocuments = [];
        
        // Coletar documentos do manifest
        if (this.manifest && this.manifest.secciones) {
            this.manifest.secciones.forEach(section => {
                if (section.items) {
                    section.items.forEach(item => {
                        allDocuments.push({
                            ...item,
                            source: 'manifest',
                            chapter: section.codigo,
                            chapterTitle: section.titulo
                        });
                    });
                }
            });
        }
        
        // Coletar documentos subidos
        if (this.uploadedDocuments) {
            this.uploadedDocuments.forEach(doc => {
                allDocuments.push({
                    ...doc,
                    source: 'uploaded',
                    chapter: doc.chapter || 'Uploaded'
                });
            });
        }

        // Aplicar filtros
        let filteredResults = allDocuments.filter(doc => {
            // Filtro de texto
            if (criteria.text) {
                const searchTerm = criteria.text.toLowerCase();
                const title = (doc.titulo || '').toLowerCase();
                const description = (doc.descripcion || '').toLowerCase();
                const tags = (doc.tags || []).join(' ').toLowerCase();
                const code = (doc.codigo || '').toLowerCase();
                
                if (!title.includes(searchTerm) && 
                    !description.includes(searchTerm) && 
                    !tags.includes(searchTerm) && 
                    !code.includes(searchTerm)) {
                    return false;
                }
            }

            // Filtro por tipo
            if (criteria.type) {
                const docType = this.getDocumentType(doc);
                if (docType !== criteria.type) return false;
            }

            // Filtro por capítulo
            if (criteria.chapter) {
                if (doc.chapter !== criteria.chapter) return false;
            }

            // Filtro por estado
            if (criteria.status) {
                if (doc.estado !== criteria.status) return false;
            }

            // Filtro por data
            if (criteria.date) {
                if (!this.matchesDateFilter(doc.fecha, criteria.date)) return false;
            }

            // Filtro por favoritos
            if (criteria.favorites) {
                const isFavorite = this.isFavorite(doc.id || doc.titulo);
                if (criteria.favorites === 'only' && !isFavorite) return false;
                if (criteria.favorites === 'exclude' && isFavorite) return false;
            }

            // Filtro por tamanho
            if (criteria.size) {
                if (!this.matchesSizeFilter(doc.tamaño, criteria.size)) return false;
            }

            return true;
        });

        // Ordenar resultados
        filteredResults = this.sortSearchResults(filteredResults, criteria.sortBy, criteria.sortOrder);

        return filteredResults;
    }

    getDocumentType(doc) {
        if (doc.tipo === 'externo') return 'externo';
        
        const ruta = doc.ruta || '';
        if (ruta.includes('.pdf')) return 'pdf';
        if (ruta.includes('.xls') || ruta.includes('.xlsx')) return 'excel';
        if (ruta.includes('.doc') || ruta.includes('.docx')) return 'word';
        if (ruta.includes('.html') || ruta.includes('.htm')) return 'html';
        
        return 'other';
    }

    matchesDateFilter(dateString, filter) {
        if (!dateString) return false;
        
        const docDate = new Date(dateString);
        const now = new Date();
        
        switch (filter) {
            case 'today':
                return docDate.toDateString() === now.toDateString();
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return docDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return docDate >= monthAgo;
            case 'quarter':
                const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                return docDate >= quarterAgo;
            case 'year':
                const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                return docDate >= yearAgo;
            default:
                return true;
        }
    }

    matchesSizeFilter(sizeString, filter) {
        if (!sizeString) return true;
        
        const size = this.parseSize(sizeString);
        
        switch (filter) {
            case 'small':
                return size < 1024 * 1024; // < 1MB
            case 'medium':
                return size >= 1024 * 1024 && size < 10 * 1024 * 1024; // 1-10MB
            case 'large':
                return size >= 10 * 1024 * 1024; // > 10MB
            default:
                return true;
        }
    }

    parseSize(sizeString) {
        const match = sizeString.match(/(\d+(?:\.\d+)?)\s*(MB|KB|GB)/i);
        if (!match) return 0;
        
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        
        switch (unit) {
            case 'KB': return value * 1024;
            case 'MB': return value * 1024 * 1024;
            case 'GB': return value * 1024 * 1024 * 1024;
            default: return value;
        }
    }

    sortSearchResults(results, sortBy, sortOrder) {
        return results.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'title':
                    aValue = (a.titulo || '').toLowerCase();
                    bValue = (b.titulo || '').toLowerCase();
                    break;
                case 'date':
                    aValue = new Date(a.fecha || 0);
                    bValue = new Date(b.fecha || 0);
                    break;
                case 'type':
                    aValue = this.getDocumentType(a);
                    bValue = this.getDocumentType(b);
                    break;
                case 'chapter':
                    aValue = a.chapter || '';
                    bValue = b.chapter || '';
                    break;
                case 'size':
                    aValue = this.parseSize(a.tamaño || '0KB');
                    bValue = this.parseSize(b.tamaño || '0KB');
                    break;
                default: // relevance
                    return 0; // Manter ordem original para relevância
            }
            
            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }

    displayAdvancedSearchResults(results) {
        console.log('📋 Exibindo resultados:', results.length);
        
        const resultsContainer = document.getElementById('advancedSearchResults');
        const resultsGrid = document.getElementById('resultsGrid');
        const resultsCount = document.getElementById('resultsCount');
        
        if (!resultsContainer || !resultsGrid || !resultsCount) {
            console.error('❌ Elementos de resultados não encontrados');
            return;
        }

        // Atualizar contador
        resultsCount.textContent = `${results.length} resultado${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}`;
        
        // Destacar o contador
        resultsCount.style.animation = 'pulse 0.5s ease-in-out 3';

        // Limpar resultados anteriores
        resultsGrid.innerHTML = '';

        if (results.length === 0) {
            resultsGrid.innerHTML = `
                <div class="no-results-advanced">
                    <div class="no-results-icon">🔍</div>
                    <h3>Nenhum resultado encontrado</h3>
                    <p>Tente ajustar os filtros ou usar termos de busca diferentes.</p>
                </div>
            `;
        } else {
            // Renderizar resultados
            results.forEach(doc => {
                const resultCard = this.createAdvancedSearchResultCard(doc);
                resultsGrid.appendChild(resultCard);
            });
        }

        // Mostrar seção de resultados com animação
        resultsContainer.style.display = 'block';
        resultsContainer.classList.add('visible');
        
        // Scroll para a seção de resultados
        setTimeout(() => {
            resultsContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 300);

        console.log('✅ Resultados exibidos com sucesso');
    }

    createAdvancedSearchResultCard(doc) {
        const card = document.createElement('div');
        card.className = 'result-card';
        
        const docType = this.getDocumentType(doc);
        const isFavorite = this.isFavorite(doc.id || doc.titulo);
        const docId = doc.id || doc.titulo;
        
        card.innerHTML = `
            <div class="result-header">
                <div class="result-title">${doc.titulo || 'Documento sem título'}</div>
                <div class="result-type">${docType.toUpperCase()}</div>
            </div>
            
            <div class="result-meta">
                <span class="result-chapter">Cap. ${doc.chapter || 'N/A'}</span>
                <div class="result-date">
                    <span>📅</span>
                    <span>${this.formatDate(doc.fecha)}</span>
                </div>
                ${doc.tamaño ? `<span>📏 ${doc.tamaño}</span>` : ''}
            </div>
            
            ${doc.descripcion ? `<p style="color: var(--gray-600); font-size: 0.9rem; margin: var(--spacing-sm) 0;">${doc.descripcion}</p>` : ''}
            
            ${doc.tags && doc.tags.length > 0 ? `
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin: var(--spacing-sm) 0;">
                    ${doc.tags.map(tag => `<span style="background: var(--gray-100); color: var(--gray-600); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">${tag}</span>`).join('')}
                </div>
            ` : ''}
            
            <div class="result-actions">
                <button class="btn-view" onclick="portal.showViewer('${docId}')">
                    <span>👁️</span>
                    <span>Ver</span>
                </button>
                <button class="btn-favorite" onclick="portal.toggleFavorite('${docId}')">
                    <span>${isFavorite ? '⭐' : '☆'}</span>
                    <span>${isFavorite ? 'Favorito' : 'Favoritar'}</span>
                </button>
            </div>
        `;
        
        return card;
    }

    // ===== SISTEMA DE TEMAS =====
    
    initializeTheme() {
        console.log('🎨 Inicializando sistema de temas...');
        
        // Carregar tema salvo ou usar padrão
        const savedTheme = localStorage.getItem('portal-theme') || 'light';
        this.setTheme(savedTheme);
        
        console.log('✅ Sistema de temas inicializado:', savedTheme);
    }

    toggleTheme() {
        console.log('🎨 Alternando tema...');
        
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        this.setTheme(newTheme);
        this.updateThemeButton(newTheme);
        
        // Salvar preferência
        localStorage.setItem('portal-theme', newTheme);
        
        this.showToast(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado!`, 'success');
        
        console.log('✅ Tema alterado para:', newTheme);
    }

    setTheme(theme) {
        console.log('🎨 Aplicando tema:', theme);
        
        // Aplicar tema ao documento
        document.documentElement.setAttribute('data-theme', theme);
        
        // Atualizar botão
        this.updateThemeButton(theme);
        
        // Adicionar classe de transição suave
        document.body.style.transition = 'background 0.3s ease, color 0.3s ease';
        
        // Remover transição após aplicação
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    updateThemeButton(theme) {
        const themeBtn = document.getElementById('themeToggleBtn');
        if (!themeBtn) return;

        const icon = themeBtn.querySelector('.btn-icon');
        const text = themeBtn.querySelector('.btn-text');
        
        if (theme === 'dark') {
            icon.textContent = '☀️';
            text.textContent = 'Claro';
            themeBtn.title = 'Mudar para Tema Claro';
        } else {
            icon.textContent = '🌙';
            text.textContent = 'Escuro';
            themeBtn.title = 'Mudar para Tema Escuro';
        }
    }

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    isDarkTheme() {
        return this.getCurrentTheme() === 'dark';
    }

    renderPDFFallback() {
        console.log('🔄 Usando visualização nativa do navegador para PDF...');
        const frame = document.getElementById('documentFrame');
        
        try {
            if (this.currentDocument.fileData) {
                console.log('📄 Dados do PDF encontrados, processando...');
                
                let pdfData;
                if (this.currentDocument.fileData.startsWith('data:application/pdf;base64,')) {
                    console.log('📄 Dados em formato Base64 detectados');
                    const base64Data = this.currentDocument.fileData.replace(/^data:application\/pdf;base64,/, '');
                    const binaryData = atob(base64Data);
                    const bytes = new Uint8Array(binaryData.length);
                    for (let i = 0; i < binaryData.length; i++) {
                        bytes[i] = binaryData.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: 'application/pdf' });
                    pdfData = URL.createObjectURL(blob);
                    console.log('📄 Blob URL criada:', pdfData.substring(0, 50) + '...');
                } else if (this.currentDocument.fileData.startsWith('data:application/pdf')) {
                    console.log('📄 Dados em formato Data URL detectados');
                    pdfData = this.currentDocument.fileData;
                } else {
                    console.log('📄 Dados em formato bruto, convertendo...');
                    const blob = new Blob([this.currentDocument.fileData], { type: 'application/pdf' });
                    pdfData = URL.createObjectURL(blob);
                }
                
                // Configurar iframe para visualização de PDF
                frame.style.width = '100%';
                frame.style.height = '100%';
                frame.style.border = 'none';
                frame.style.background = 'white';
                
                console.log('📄 Carregando PDF no iframe...');
                frame.src = pdfData;
                
                // Verificar se carregou
                frame.onload = () => {
                    console.log('✅ PDF carregado no iframe com sucesso');
                };
                
                frame.onerror = (error) => {
                    console.error('❌ Erro ao carregar PDF no iframe:', error);
                    this.showPDFError();
                };
                
                // Limpar URL quando fechar o modal
                const modal = document.getElementById('viewerModal');
                const cleanup = () => {
                    if (pdfData && pdfData.startsWith('blob:')) {
                        URL.revokeObjectURL(pdfData);
                        console.log('🧹 Blob URL limpa');
                    }
                    modal.removeEventListener('hidden', cleanup);
                };
                modal.addEventListener('hidden', cleanup);
                
                console.log('✅ PDF configurado para visualização nativa');
            } else {
                throw new Error('Dados do PDF não encontrados');
            }
        } catch (error) {
            console.error('❌ Erro no processamento do PDF:', error);
            this.showPDFError();
        }
    }
    
    showPDFError() {
        const frame = document.getElementById('documentFrame');
        frame.src = 'about:blank';
        frame.onload = () => {
            const iframeDoc = frame.contentDocument || frame.contentWindow.document;
            iframeDoc.body.innerHTML = `
                <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif; background: white; min-height: 100vh;">
                    <h2 style="color: #dc3545; margin-bottom: 20px;">❌ Erro ao visualizar PDF</h2>
                    <p style="color: #666; margin-bottom: 20px;">Não foi possível carregar o PDF "${this.currentDocument.titulo}".</p>
                    <p style="color: #666; margin-bottom: 30px;">Possíveis causas:</p>
                    <ul style="text-align: left; max-width: 400px; margin: 20px auto; color: #666;">
                        <li>Arquivo PDF corrompido</li>
                        <li>PDF protegido por senha</li>
                        <li>Formato não suportado</li>
                        <li>Arquivo muito grande</li>
                        <li>Problema de compatibilidade do navegador</li>
                    </ul>
                    <div style="margin-top: 30px;">
                        <button onclick="portal.downloadDoc()" style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin: 8px; font-size: 14px;">
                            📥 Tentar Download
                        </button>
                        <button onclick="portal.hideViewer()" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin: 8px; font-size: 14px;">
                            ✕ Fechar
                        </button>
                    </div>
                </div>
            `;
        };
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM carregado, inicializando portal...');
    window.portal = new PortalCalidad();
});