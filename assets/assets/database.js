// Sistema de Base de Dados IndexedDB para Portal de Calidad
class DatabaseManager {
    constructor() {
        this.dbName = 'PortalCalidadDB';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store para documentos
                if (!db.objectStoreNames.contains('documents')) {
                    const documentStore = db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
                    documentStore.createIndex('chapter', 'chapter', { unique: false });
                    documentStore.createIndex('title', 'title', { unique: false });
                    documentStore.createIndex('date', 'date', { unique: false });
                    documentStore.createIndex('status', 'status', { unique: false });
                    documentStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                }
                
                // Store para arquivos
                if (!db.objectStoreNames.contains('files')) {
                    const fileStore = db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
                    fileStore.createIndex('documentId', 'documentId', { unique: false });
                    fileStore.createIndex('type', 'type', { unique: false });
                    fileStore.createIndex('name', 'name', { unique: false });
                }
            };
        });
    }

    async saveDocument(documentData) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents'], 'readwrite');
            const store = transaction.objectStore('documents');
            const request = store.add(documentData);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveFile(fileData) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.add(fileData);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getDocuments(chapter = null) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents'], 'readonly');
            const store = transaction.objectStore('documents');
            const request = chapter ? store.index('chapter').getAll(chapter) : store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getDocumentById(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents'], 'readonly');
            const store = transaction.objectStore('documents');
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getFile(fileId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const request = store.get(fileId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getFilesByDocument(documentId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const request = store.index('documentId').getAll(documentId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateDocument(id, documentData) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents'], 'readwrite');
            const store = transaction.objectStore('documents');
            const request = store.put({ ...documentData, id });
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateFile(id, fileData) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.put({ ...fileData, id });
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteDocument(documentId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents', 'files'], 'readwrite');
            const documentStore = transaction.objectStore('documents');
            const fileStore = transaction.objectStore('files');
            
            // Eliminar archivos asociados
            const fileIndex = fileStore.index('documentId');
            const fileRequest = fileIndex.getAll(documentId);
            
            fileRequest.onsuccess = () => {
                fileRequest.result.forEach(file => {
                    fileStore.delete(file.id);
                });
            };
            
            // Eliminar documento
            const docRequest = documentStore.delete(documentId);
            docRequest.onsuccess = () => resolve();
            docRequest.onerror = () => reject(docRequest.error);
        });
    }

    async searchDocuments(query) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents'], 'readonly');
            const store = transaction.objectStore('documents');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const documents = request.result;
                const filtered = documents.filter(doc => {
                    const searchText = query.toLowerCase();
                    return (
                        doc.title.toLowerCase().includes(searchText) ||
                        doc.tags.some(tag => tag.toLowerCase().includes(searchText)) ||
                        doc.chapter.toLowerCase().includes(searchText)
                    );
                });
                resolve(filtered);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getDocumentStats() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents'], 'readonly');
            const store = transaction.objectStore('documents');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const documents = request.result;
                const stats = {
                    total: documents.length,
                    byStatus: {},
                    byChapter: {},
                    recent: 0
                };
                
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                
                documents.forEach(doc => {
                    // Por estado
                    stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;
                    
                    // Por capítulo
                    stats.byChapter[doc.chapter] = (stats.byChapter[doc.chapter] || 0) + 1;
                    
                    // Recientes
                    if (new Date(doc.date) >= weekAgo) {
                        stats.recent++;
                    }
                });
                
                resolve(stats);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Métodos de utilidade
    async clearAllData() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents', 'files'], 'readwrite');
            const documentStore = transaction.objectStore('documents');
            const fileStore = transaction.objectStore('files');
            
            const docRequest = documentStore.clear();
            const fileRequest = fileStore.clear();
            
            Promise.all([docRequest, fileRequest]).then(() => resolve()).catch(reject);
        });
    }

    async exportData() {
        if (!this.db) await this.init();
        
        const documents = await this.getDocuments();
        const files = [];
        
        for (const doc of documents) {
            const docFiles = await this.getFilesByDocument(doc.id);
            files.push(...docFiles);
        }
        
        return {
            documents,
            files,
            exportDate: new Date().toISOString(),
            version: this.dbVersion
        };
    }

    async importData(data) {
        if (!this.db) await this.init();
        
        try {
            // Limpiar datos existentes
            await this.clearAllData();
            
            // Importar documentos
            for (const doc of data.documents) {
                await this.saveDocument(doc);
            }
            
            // Importar archivos
            for (const file of data.files) {
                await this.saveFile(file);
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Instância global
window.dbManager = new DatabaseManager();
