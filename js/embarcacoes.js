// Embarcacoes module

const Embarcacoes = {
    list: [],

    async init() {
        await this.loadList();
        this.setupEventListeners();
    },

    async loadList() {
        this.list = await Database.getAllEmbarcacoes();
        await this.render();
    },

    async render(filterTipo = '') {
        const listEl = document.getElementById('list-embarcacoes');
        const emptyEl = document.getElementById('no-embarcacoes');

        let filtered = this.list;
        if (filterTipo) {
            filtered = this.list.filter(e => e.tipo === filterTipo);
        }

        if (filtered.length === 0) {
            listEl.innerHTML = '';
            emptyEl.classList.remove('hidden');
            return;
        }

        emptyEl.classList.add('hidden');

        // Get cliente names
        const clientesMap = {};
        for (const emb of filtered) {
            if (emb.clienteId && !clientesMap[emb.clienteId]) {
                const cliente = await Database.getCliente(emb.clienteId);
                if (cliente) clientesMap[emb.clienteId] = cliente.nome;
            }
        }

        listEl.innerHTML = filtered.map(emb => `
            <li data-id="${emb.id}">
                <div class="item-info">
                    <div class="item-title">${emb.nome}</div>
                    <div class="item-subtitle">
                        ${Utils.tipoEmbarcacaoLabel(emb.tipo)}
                        ${emb.clienteId ? ` - ${clientesMap[emb.clienteId] || ''}` : ''}
                    </div>
                </div>
                <span class="item-badge badge-${emb.vagaId ? 'ocupada' : 'livre'}">
                    ${emb.vagaId ? 'Alocada' : 'Sem vaga'}
                </span>
            </li>
        `).join('');

        // Add click handlers
        listEl.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                const id = parseInt(li.dataset.id);
                this.showDetail(id);
            });
        });
    },

    setupEventListeners() {
        const filterSelect = document.getElementById('filter-tipo-embarcacao');
        filterSelect.addEventListener('change', (e) => {
            this.render(e.target.value);
        });
    },

    async getFormHTML(embarcacao = null) {
        const clientes = await Database.getAllClientes();
        const vagasLivres = await Database.getVagasLivres();

        // If editing, include current vaga in list
        let currentVaga = null;
        if (embarcacao?.vagaId) {
            currentVaga = await Database.getVaga(embarcacao.vagaId);
        }

        return `
            <form id="form-embarcacao">
                <div class="form-group">
                    <label for="emb-nome">Nome *</label>
                    <input type="text" id="emb-nome" required value="${embarcacao?.nome || ''}">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="emb-tipo">Tipo *</label>
                        <select id="emb-tipo" required>
                            <option value="">Selecione</option>
                            <option value="lancha" ${embarcacao?.tipo === 'lancha' ? 'selected' : ''}>Lancha</option>
                            <option value="jet-ski" ${embarcacao?.tipo === 'jet-ski' ? 'selected' : ''}>Jet Ski</option>
                            <option value="veleiro" ${embarcacao?.tipo === 'veleiro' ? 'selected' : ''}>Veleiro</option>
                            <option value="iate" ${embarcacao?.tipo === 'iate' ? 'selected' : ''}>Iate</option>
                            <option value="barco" ${embarcacao?.tipo === 'barco' ? 'selected' : ''}>Barco</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="emb-modelo">Modelo</label>
                        <input type="text" id="emb-modelo" value="${embarcacao?.modelo || ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="emb-ano">Ano</label>
                        <input type="number" id="emb-ano" min="1900" max="2030" value="${embarcacao?.ano || ''}">
                    </div>
                    <div class="form-group">
                        <label for="emb-comprimento">Comprimento (m)</label>
                        <input type="number" id="emb-comprimento" step="0.1" min="0" value="${embarcacao?.comprimento || ''}">
                    </div>
                </div>

                <div class="form-group">
                    <label for="emb-cliente">Cliente *</label>
                    <select id="emb-cliente" required>
                        <option value="">Selecione</option>
                        ${clientes.map(c => `
                            <option value="${c.id}" ${embarcacao?.clienteId === c.id ? 'selected' : ''}>
                                ${c.nome}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label for="emb-vaga">Vaga</label>
                    <select id="emb-vaga">
                        <option value="">Sem vaga</option>
                        ${currentVaga ? `
                            <option value="${currentVaga.id}" selected>
                                Vaga ${currentVaga.numero} (${Utils.tamanhoVagaLabel(currentVaga.tamanho)}) - atual
                            </option>
                        ` : ''}
                        ${vagasLivres.map(v => `
                            <option value="${v.id}">
                                Vaga ${v.numero} (${Utils.tamanhoVagaLabel(v.tamanho)})
                            </option>
                        `).join('')}
                    </select>
                </div>
            </form>
        `;
    },

    async showForm(embarcacao = null) {
        const isEdit = embarcacao !== null;
        const title = isEdit ? 'Editar Embarcacao' : 'Nova Embarcacao';
        const formHTML = await this.getFormHTML(embarcacao);

        Modal.open(title, formHTML, {
            onSave: async () => {
                const data = {
                    nome: document.getElementById('emb-nome').value.trim(),
                    tipo: document.getElementById('emb-tipo').value,
                    modelo: document.getElementById('emb-modelo').value.trim(),
                    ano: parseInt(document.getElementById('emb-ano').value) || null,
                    comprimento: parseFloat(document.getElementById('emb-comprimento').value) || null,
                    clienteId: parseInt(document.getElementById('emb-cliente').value) || null,
                    vagaId: parseInt(document.getElementById('emb-vaga').value) || null
                };

                if (!data.nome || !data.tipo || !data.clienteId) {
                    Utils.showToast('Preencha os campos obrigatorios', 'error');
                    return;
                }

                try {
                    if (isEdit) {
                        await Database.updateEmbarcacao(embarcacao.id, data);
                        Utils.showToast('Embarcacao atualizada', 'success');
                    } else {
                        await Database.addEmbarcacao(data);
                        Utils.showToast('Embarcacao cadastrada', 'success');
                    }
                    Modal.close();
                    await this.loadList();
                    await Vagas.loadList();
                } catch (error) {
                    Utils.showToast(error.message, 'error');
                }
            },
            onDelete: isEdit ? async () => {
                try {
                    await Database.deleteEmbarcacao(embarcacao.id);
                    Utils.showToast('Embarcacao excluida', 'success');
                    Modal.close();
                    await this.loadList();
                    await Vagas.loadList();
                } catch (error) {
                    Utils.showToast(error.message, 'error');
                }
            } : null
        });
    },

    async showDetail(id) {
        const embarcacao = await Database.getEmbarcacao(id);
        if (!embarcacao) return;

        const cliente = embarcacao.clienteId ? await Database.getCliente(embarcacao.clienteId) : null;
        const vaga = embarcacao.vagaId ? await Database.getVaga(embarcacao.vagaId) : null;
        const manutencoes = await Database.getManutencoesByEmbarcacao(id);

        const html = `
            <div class="detail-section">
                <p><strong>Nome:</strong> ${embarcacao.nome}</p>
                <p><strong>Tipo:</strong> ${Utils.tipoEmbarcacaoLabel(embarcacao.tipo)}</p>
                <p><strong>Modelo:</strong> ${embarcacao.modelo || '-'}</p>
                <p><strong>Ano:</strong> ${embarcacao.ano || '-'}</p>
                <p><strong>Comprimento:</strong> ${embarcacao.comprimento ? embarcacao.comprimento + ' m' : '-'}</p>
                <p><strong>Cliente:</strong> ${cliente ? cliente.nome : '-'}</p>
                <p><strong>Vaga:</strong> ${vaga ? `Vaga ${vaga.numero}` : 'Sem vaga'}</p>
            </div>

            <div class="detail-section mt-16">
                <h3>Manutencoes (${manutencoes.length})</h3>
                ${manutencoes.length > 0 ? `
                    <ul class="item-list">
                        ${manutencoes.slice(0, 5).map(m => `
                            <li>
                                <div class="item-info">
                                    <div class="item-title">${m.tipo}</div>
                                    <div class="item-subtitle">${Utils.formatDate(m.proximaData)}</div>
                                </div>
                                <span class="item-badge badge-${m.status}">${Utils.capitalize(m.status)}</span>
                            </li>
                        `).join('')}
                    </ul>
                ` : '<p class="empty-message">Nenhuma manutencao</p>'}
            </div>

            ${cliente ? `
                <div class="mt-16">
                    <a href="${Utils.whatsappLink(cliente.telefone, `Ola ${cliente.nome}! Sobre sua embarcacao ${embarcacao.nome}...`)}"
                       target="_blank" class="btn btn-whatsapp btn-block">
                        Contatar Cliente
                    </a>
                </div>
            ` : ''}

            <div class="mt-16">
                <button type="button" class="btn btn-primary btn-block" id="btn-edit-embarcacao">
                    Editar Embarcacao
                </button>
            </div>

            <div class="mt-16">
                <button type="button" class="btn btn-secondary btn-block" id="btn-nova-manutencao">
                    Nova Manutencao
                </button>
            </div>
        `;

        Modal.open(embarcacao.nome, html, {
            hideCancel: true
        });

        document.getElementById('btn-edit-embarcacao').addEventListener('click', () => {
            Modal.close();
            this.showForm(embarcacao);
        });

        document.getElementById('btn-nova-manutencao').addEventListener('click', () => {
            Modal.close();
            Manutencoes.showForm(null, embarcacao.id);
        });
    }
};
