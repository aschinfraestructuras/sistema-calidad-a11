// Configuração do Portal de Calidad
const CONFIG = {
    // Configuración de autenticación
    auth: {
        enabled: false, // Desabilitado para facilitar o teste
        users: [
            {
                username: 'admin',
                passwordHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', // asch2025
                role: 'admin',
                name: 'Administrador ASCH'
            },
            {
                username: 'calidad',
                passwordHash: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890', // calidad2025
                role: 'user',
                name: 'Usuario Calidad'
            },
            {
                username: 'obra',
                passwordHash: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890ab', // obra2025
                role: 'user',
                name: 'Usuario Obra'
            }
        ]
    }
};