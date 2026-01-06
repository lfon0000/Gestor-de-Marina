// Database configuration using Dexie.js
const db = new Dexie('MarinaDB');

// Schema definition
db.version(1).stores({
    clientes: '++id, nome, telefone, email',
    vagas: '++id, numero, tamanho, tipo, status',
    embarcacoes: '++id, nome, tipo, modelo, clienteId, vagaId',
    manutencoes: '++id, embarcacaoId, tipo, status, proximaData, dataRealizada'
});

// Initialize database with default vagas if empty
async function initDatabase() {
    const vagasCount = await db.vagas.count();

    if (vagasCount === 0) {
        // Create 12 default vagas (pequena marina)
        const defaultVagas = [];
        for (let i = 1; i <= 12; i++) {
            defaultVagas.push({
                numero: i,
                tamanho: i <= 4 ? 'P' : (i <= 8 ? 'M' : 'G'),
                tipo: i % 2 === 0 ? 'agua' : 'seca',
                status: 'livre'
            });
        }
        await db.vagas.bulkAdd(defaultVagas);
        console.log('Vagas iniciais criadas');
    }
}

// Database helper functions
const Database = {
    // Clientes
    async getAllClientes() {
        return await db.clientes.toArray();
    },

    async getCliente(id) {
        return await db.clientes.get(id);
    },

    async addCliente(cliente) {
        return await db.clientes.add(cliente);
    },

    async updateCliente(id, data) {
        return await db.clientes.update(id, data);
    },

    async deleteCliente(id) {
        // Check if cliente has embarcacoes
        const embarcacoes = await db.embarcacoes.where('clienteId').equals(id).count();
        if (embarcacoes > 0) {
            throw new Error('Cliente possui embarcacoes vinculadas');
        }
        return await db.clientes.delete(id);
    },

    // Vagas
    async getAllVagas() {
        return await db.vagas.orderBy('numero').toArray();
    },

    async getVaga(id) {
        return await db.vagas.get(id);
    },

    async addVaga(vaga) {
        return await db.vagas.add(vaga);
    },

    async updateVaga(id, data) {
        return await db.vagas.update(id, data);
    },

    async deleteVaga(id) {
        const vaga = await db.vagas.get(id);
        if (vaga && vaga.status === 'ocupada') {
            throw new Error('Vaga esta ocupada');
        }
        return await db.vagas.delete(id);
    },

    async getVagasLivres() {
        return await db.vagas.where('status').equals('livre').toArray();
    },

    // Embarcacoes
    async getAllEmbarcacoes() {
        return await db.embarcacoes.toArray();
    },

    async getEmbarcacao(id) {
        return await db.embarcacoes.get(id);
    },

    async getEmbarcacoesByCliente(clienteId) {
        return await db.embarcacoes.where('clienteId').equals(clienteId).toArray();
    },

    async getEmbarcacaoByVaga(vagaId) {
        return await db.embarcacoes.where('vagaId').equals(vagaId).first();
    },

    async addEmbarcacao(embarcacao) {
        const id = await db.embarcacoes.add(embarcacao);

        // Update vaga status if assigned
        if (embarcacao.vagaId) {
            await db.vagas.update(embarcacao.vagaId, { status: 'ocupada' });
        }

        return id;
    },

    async updateEmbarcacao(id, data) {
        const oldEmbarcacao = await db.embarcacoes.get(id);

        // Handle vaga changes
        if (oldEmbarcacao.vagaId !== data.vagaId) {
            // Free old vaga
            if (oldEmbarcacao.vagaId) {
                await db.vagas.update(oldEmbarcacao.vagaId, { status: 'livre' });
            }
            // Occupy new vaga
            if (data.vagaId) {
                await db.vagas.update(data.vagaId, { status: 'ocupada' });
            }
        }

        return await db.embarcacoes.update(id, data);
    },

    async deleteEmbarcacao(id) {
        const embarcacao = await db.embarcacoes.get(id);

        // Free vaga if assigned
        if (embarcacao && embarcacao.vagaId) {
            await db.vagas.update(embarcacao.vagaId, { status: 'livre' });
        }

        // Delete related manutencoes
        await db.manutencoes.where('embarcacaoId').equals(id).delete();

        return await db.embarcacoes.delete(id);
    },

    // Manutencoes
    async getAllManutencoes() {
        return await db.manutencoes.toArray();
    },

    async getManutencao(id) {
        return await db.manutencoes.get(id);
    },

    async getManutencoesByEmbarcacao(embarcacaoId) {
        return await db.manutencoes.where('embarcacaoId').equals(embarcacaoId).toArray();
    },

    async addManutencao(manutencao) {
        return await db.manutencoes.add(manutencao);
    },

    async updateManutencao(id, data) {
        return await db.manutencoes.update(id, data);
    },

    async deleteManutencao(id) {
        return await db.manutencoes.delete(id);
    },

    async getManutencoesPendentes() {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const manutencoes = await db.manutencoes
            .where('status')
            .anyOf(['pendente', 'atrasada'])
            .toArray();

        // Update status based on date
        for (const m of manutencoes) {
            if (m.proximaData) {
                const dataProxima = new Date(m.proximaData);
                dataProxima.setHours(0, 0, 0, 0);

                if (dataProxima < hoje && m.status !== 'atrasada') {
                    await db.manutencoes.update(m.id, { status: 'atrasada' });
                    m.status = 'atrasada';
                }
            }
        }

        return manutencoes;
    },

    async getManutencoesPorPeriodo(dias) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const limite = new Date(hoje);
        limite.setDate(limite.getDate() + dias);

        const manutencoes = await db.manutencoes.toArray();

        return manutencoes.filter(m => {
            if (!m.proximaData || m.status === 'concluida') return false;
            const data = new Date(m.proximaData);
            data.setHours(0, 0, 0, 0);
            return data >= hoje && data <= limite;
        });
    },

    async getManutencoesAtrasadas() {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const manutencoes = await db.manutencoes.toArray();

        return manutencoes.filter(m => {
            if (!m.proximaData || m.status === 'concluida') return false;
            const data = new Date(m.proximaData);
            data.setHours(0, 0, 0, 0);
            return data < hoje;
        });
    },

    // Backup
    async exportAllData() {
        const data = {
            version: 1,
            exportDate: new Date().toISOString(),
            clientes: await db.clientes.toArray(),
            vagas: await db.vagas.toArray(),
            embarcacoes: await db.embarcacoes.toArray(),
            manutencoes: await db.manutencoes.toArray()
        };
        return data;
    },

    async importAllData(data) {
        if (!data.version || !data.clientes || !data.vagas || !data.embarcacoes || !data.manutencoes) {
            throw new Error('Formato de arquivo invalido');
        }

        await db.transaction('rw', db.clientes, db.vagas, db.embarcacoes, db.manutencoes, async () => {
            // Clear all tables
            await db.clientes.clear();
            await db.vagas.clear();
            await db.embarcacoes.clear();
            await db.manutencoes.clear();

            // Import data
            if (data.clientes.length) await db.clientes.bulkAdd(data.clientes);
            if (data.vagas.length) await db.vagas.bulkAdd(data.vagas);
            if (data.embarcacoes.length) await db.embarcacoes.bulkAdd(data.embarcacoes);
            if (data.manutencoes.length) await db.manutencoes.bulkAdd(data.manutencoes);
        });
    },

    // Statistics
    async getStats() {
        const vagas = await db.vagas.toArray();
        const vagasLivres = vagas.filter(v => v.status === 'livre').length;
        const vagasOcupadas = vagas.filter(v => v.status === 'ocupada').length;
        const embarcacoes = await db.embarcacoes.count();
        const manutencoesPendentes = (await this.getManutencoesPendentes()).length;

        return {
            vagasLivres,
            vagasOcupadas,
            embarcacoes,
            manutencoesPendentes
        };
    }
};

// Initialize on load
initDatabase().catch(console.error);
