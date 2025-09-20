// Visualizador de Documentos Avançado
class DocumentViewer {
    constructor() {
        this.currentDocument = null;
        this.currentFile = null;
        this.viewerModal = null;
    }

    async openDocument(documentId) {
        try {
            console.log('👁️ Abrindo documento no visualizador:', documentId);
            
            let document = null;
            let file = null;
            
            // Tentar IndexedDB primeiro
            try {
                document = await dbManager.getDocumentById(documentId);
                if (document) {
                    file = await dbManager.getFile(document.fileId);
                    console.log('✅ Documento e ficheiro encontrados na IndexedDB para visualização');
                }
            } catch (dbError) {
                console.warn('⚠️ IndexedDB falhou, tentando localStorage:', dbError);
            }
            
            // Se não encontrou na IndexedDB, tentar localStorage
            if (!document || !file) {
                const storedDocs = JSON.parse(localStorage.getItem('storedDocuments') || '[]');
                document = storedDocs.find(doc => doc.id === documentId);
                
                if (document) {
                    const storedFiles = JSON.parse(localStorage.getItem('storedFiles') || '{}');
                    file = storedFiles[document.fileId];
                    console.log('✅ Documento e ficheiro encontrados no localStorage para visualização');
                }
            }
            
            if (!document) {
                this.showError('Documento não encontrado');
                return;
            }

            if (!file) {
                this.showError('Arquivo não encontrado');
                return;
            }

            this.currentDocument = document;
            this.currentFile = file;

            console.log('📋 Documento carregado para visualização:', document);
            console.log('📁 Ficheiro carregado para visualização:', file);

            this.createViewerModal();
            this.renderDocument();
        } catch (error) {
            console.error('❌ Erro ao abrir documento:', error);
            this.showError('Erro ao abrir documento');
        }
    }

    createViewerModal() {
        // Remover modal existente se houver
        const existingModal = document.getElementById('documentViewerModal');
        if (existingModal) {
            existingModal.remove();
        }

        this.viewerModal = document.createElement('div');
        this.viewerModal.id = 'documentViewerModal';
        this.viewerModal.className = 'modal document-viewer-modal';
        this.viewerModal.innerHTML = `
            <div class="modal-overlay" onclick="this.closest('.modal').remove()"></div>
            <div class="modal-content document-viewer">
                <div class="viewer-header">
                    <div class="viewer-title">
                        <h3>${this.currentDocument.title}</h3>
                        <div class="viewer-meta">
                            <span class="document-type">${this.getFileTypeLabel(this.currentFile.type)}</span>
                            <span class="document-size">${this.formatFileSize(this.currentFile.size)}</span>
                            <span class="document-date">${this.formatDate(this.currentDocument.date)}</span>
                        </div>
                    </div>
                    <div class="viewer-actions">
                        <button class="btn btn-secondary" onclick="documentViewer.close()">✕ Fechar</button>
                        <button class="btn btn-primary" onclick="documentViewer.download()">📥 Descargar</button>
                        <button class="btn btn-primary" onclick="documentViewer.print()">🖨️ Imprimir</button>
                        <button class="btn btn-secondary" onclick="documentViewer.editDocument()">✏️ Editar</button>
                    </div>
                </div>
                <div class="viewer-content" id="viewerContent">
                    <div class="loading">Carregando documento...</div>
                </div>
            </div>
        `;

        document.body.appendChild(this.viewerModal);
    }

    async renderDocument() {
        const content = document.getElementById('viewerContent');
        const fileType = this.currentFile.type.toLowerCase();

        try {
            if (fileType === 'text/html' || fileType === 'application/xhtml+xml') {
                await this.renderHTML();
            } else if (fileType === 'application/pdf') {
                await this.renderPDF();
            } else if (fileType === 'text/plain') {
                await this.renderText();
            } else if (fileType.includes('word') || fileType.includes('document')) {
                await this.renderWord();
            } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
                await this.renderExcel();
            } else {
                this.renderUnsupported();
            }
        } catch (error) {
            console.error('Erro ao renderizar documento:', error);
            content.innerHTML = `
                <div class="error-message">
                    <h4>❌ Erro ao carregar documento</h4>
                    <p>Não foi possível carregar o documento. Tente descarregá-lo.</p>
                    <button class="btn btn-primary" onclick="documentViewer.download()">Descargar Documento</button>
                </div>
            `;
        }
    }

    async renderHTML() {
        const content = document.getElementById('viewerContent');
        
        try {
            // Converter base64 para HTML
            const htmlContent = atob(this.currentFile.data);
            
            // Criar iframe para renderizar HTML
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '600px';
            iframe.style.border = 'none';
            iframe.style.borderRadius = '8px';
            
            iframe.onload = () => {
                // Adicionar estilos para melhor visualização
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const style = iframeDoc.createElement('style');
                style.textContent = `
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        margin: 20px;
                        background: #f8f9fa;
                    }
                    .container { 
                        max-width: 800px; 
                        margin: 0 auto; 
                        background: white; 
                        padding: 30px; 
                        border-radius: 8px; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                `;
                iframeDoc.head.appendChild(style);
            };
            
            content.innerHTML = '';
            content.appendChild(iframe);
            
            // Escrever conteúdo no iframe
            iframe.srcdoc = htmlContent;
            
        } catch (error) {
            throw new Error('Erro ao processar HTML');
        }
    }

    async renderPDF() {
        const content = document.getElementById('viewerContent');
        
        try {
            // Criar iframe para PDF
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '600px';
            iframe.style.border = 'none';
            iframe.style.borderRadius = '8px';
            
            // Converter base64 para blob
            const binaryString = atob(this.currentFile.data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            iframe.src = url;
            content.innerHTML = '';
            content.appendChild(iframe);
            
            // Limpar URL quando fechar
            this.viewerModal.addEventListener('remove', () => {
                URL.revokeObjectURL(url);
            });
            
        } catch (error) {
            throw new Error('Erro ao processar PDF');
        }
    }

    async renderText() {
        const content = document.getElementById('viewerContent');
        
        try {
            // Converter base64 para texto
            const textContent = atob(this.currentFile.data);
            
            const textContainer = document.createElement('div');
            textContainer.style.cssText = `
                background: white;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                line-height: 1.6;
                white-space: pre-wrap;
                word-wrap: break-word;
                max-height: 600px;
                overflow-y: auto;
                color: #1e293b;
            `;
            
            textContainer.textContent = textContent;
            content.innerHTML = '';
            content.appendChild(textContainer);
            
        } catch (error) {
            throw new Error('Erro ao processar arquivo de texto');
        }
    }

    async renderWord() {
        const content = document.getElementById('viewerContent');
        
        content.innerHTML = `
            <div class="document-preview">
                <div class="preview-header">
                    <div class="file-icon">📝</div>
                    <div class="file-info">
                        <h4>Documento Word</h4>
                        <p>${this.currentFile.name}</p>
                        <p class="file-meta">${this.formatFileSize(this.currentFile.size)} • ${this.currentFile.type}</p>
                    </div>
                </div>
                
                <div class="preview-content">
                    <div class="preview-message">
                        <h5>📄 Visualização não disponível</h5>
                        <p>Os documentos Word não podem ser visualizados diretamente no navegador.</p>
                        <p>Para visualizar este documento:</p>
                        <ul>
                            <li>Descargue o arquivo e abra com Microsoft Word</li>
                            <li>Ou use LibreOffice Writer (gratuito)</li>
                            <li>Ou converta para PDF para visualização online</li>
                        </ul>
                    </div>
                    
                    <div class="preview-actions">
                        <button class="btn btn-primary" onclick="documentViewer.download()">
                            📥 Descargar Documento
                        </button>
                        <button class="btn btn-secondary" onclick="documentViewer.print()">
                            🖨️ Imprimir (se suportado)
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async renderExcel() {
        const content = document.getElementById('viewerContent');
        
        content.innerHTML = `
            <div class="document-preview">
                <div class="preview-header">
                    <div class="file-icon">📊</div>
                    <div class="file-info">
                        <h4>Planilha Excel</h4>
                        <p>${this.currentFile.name}</p>
                        <p class="file-meta">${this.formatFileSize(this.currentFile.size)} • ${this.currentFile.type}</p>
                    </div>
                </div>
                
                <div class="preview-content">
                    <div class="preview-message">
                        <h5>📊 Visualização não disponível</h5>
                        <p>As planilhas Excel não podem ser visualizadas diretamente no navegador.</p>
                        <p>Para visualizar esta planilha:</p>
                        <ul>
                            <li>Descargue o arquivo e abra com Microsoft Excel</li>
                            <li>Ou use LibreOffice Calc (gratuito)</li>
                            <li>Ou converta para PDF para visualização online</li>
                        </ul>
                    </div>
                    
                    <div class="preview-actions">
                        <button class="btn btn-primary" onclick="documentViewer.download()">
                            📥 Descargar Planilha
                        </button>
                        <button class="btn btn-secondary" onclick="documentViewer.print()">
                            🖨️ Imprimir (se suportado)
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderUnsupported() {
        const content = document.getElementById('viewerContent');
        
        content.innerHTML = `
            <div class="document-preview">
                <div class="preview-header">
                    <div class="file-icon">📁</div>
                    <div class="file-info">
                        <h4>Tipo de arquivo não suportado</h4>
                        <p>${this.currentFile.name}</p>
                        <p class="file-meta">${this.formatFileSize(this.currentFile.size)} • ${this.currentFile.type}</p>
                    </div>
                </div>
                
                <div class="preview-content">
                    <div class="preview-message">
                        <h5>❌ Visualização não disponível</h5>
                        <p>Este tipo de arquivo não pode ser visualizado diretamente no navegador.</p>
                        <p>Descargue o arquivo para abri-lo com a aplicação correspondente.</p>
                    </div>
                    
                    <div class="preview-actions">
                        <button class="btn btn-primary" onclick="documentViewer.download()">
                            📥 Descargar Arquivo
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async download() {
        try {
            const binaryString = atob(this.currentFile.data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const blob = new Blob([bytes], { type: this.currentFile.type });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = this.currentFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showSuccess('Documento descargado com sucesso');
        } catch (error) {
            console.error('Erro ao descargar:', error);
            this.showError('Erro ao descargar documento');
        }
    }

    async print() {
        try {
            if (this.currentFile.type === 'text/html' || this.currentFile.type === 'application/xhtml+xml') {
                const printWindow = window.open('', '_blank');
                const htmlContent = atob(this.currentFile.data);
                printWindow.document.write(htmlContent);
                printWindow.document.close();
                printWindow.print();
            } else {
                this.showWarning('Apenas documentos HTML podem ser impressos diretamente');
            }
        } catch (error) {
            console.error('Erro ao imprimir:', error);
            this.showError('Erro ao imprimir documento');
        }
    }

    editDocument() {
        // Implementar edição de documentos
        this.showInfo('Funcionalidade de edição em desenvolvimento');
    }

    close() {
        if (this.viewerModal) {
            this.viewerModal.remove();
            this.viewerModal = null;
        }
        this.currentDocument = null;
        this.currentFile = null;
    }

    // Métodos de utilidade
    getFileTypeLabel(type) {
        const types = {
            'text/html': 'HTML',
            'text/plain': 'Texto',
            'application/pdf': 'PDF',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
            'application/msword': 'Word',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
            'application/vnd.ms-excel': 'Excel',
            'application/rtf': 'RTF'
        };
        return types[type] || type.split('/')[1].toUpperCase();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showSuccess(message) {
        if (window.portal) {
            window.portal.showToast(message, 'success');
        }
    }

    showError(message) {
        if (window.portal) {
            window.portal.showToast(message, 'error');
        }
    }

    showWarning(message) {
        if (window.portal) {
            window.portal.showToast(message, 'warning');
        }
    }

    showInfo(message) {
        if (window.portal) {
            window.portal.showToast(message, 'info');
        }
    }
}

// Instância global
window.documentViewer = new DocumentViewer();
