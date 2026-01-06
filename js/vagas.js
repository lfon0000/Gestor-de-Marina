// Vagas module

const Vagas = {
    list: [],

    async init() {
        await this.loadList();
    },

    async loadList() {
        this.list = await Database.getAllVagas();
        this.render();
    },

    async render() {
        const gridEl = document.getElementById('vagas-grid');
        const emptyEl = document.getElementById('no-vagas');

        if (this.list.length === 0) {
            gridEl.innerHTML = '';
            emptyEl.classList.remove('hidden');
            return;
        }

        emptyEl.classList.add('hidden');

        // Get embarcacoes for each occupied vaga
        const embarcacoesMap = {};
        for (const vaga of this.list) {
            if (vaga.status === 'ocupada') {
                const emb = await Database.getEmbarcacaoByVaga(vaga.id);
                if (emb) embarcacoesMap[vaga.id] = emb;
            }
        }

        gridEl.innerHTML = this.list.map(vaga => {
            const emb = embarcacoesMap[vaga.id];
            return `
                <div class="vaga-card ${vaga.status}" data-id="${vaga.id}">
                    <span class="vaga-numero">${vaga.numero}</span>
                    <span class="vaga-tamanho">${Utils.tamanhoVagaLabel(vaga.tamanho)}</span>
                    ${emb ? `<span class="vaga-embarcacao">${emb.nome}</span>` : ''}
                </div>
            `;
        }).join('');

        // Add click handlers
        gridEl.querySelectorAll('.vaga-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                this.showDetail(id);
            });
        });
    },

    getFormHTML(vaga = null) {
        return `
            <form id="form-vaga">
                <div class="form-row">
                    <div class="form-group">
                        <label for="vaga-numero">Numero *</label>
                        <input type="number" id="vaga-numero" required min="1" value="${vaga?.numero || ''}">
                    </div>
                    <div class="form-group">
                        <label for="vaga-tamanho">Tamanho *</label>
                        <select id="vaga-tamanho" required>
                            <option value="P" ${vaga?.tamanho === 'P' ? 'selected' : ''}>Pequena</option>
                            <option value="M" ${vaga?.tamanho === 'M' ? 'selected' : ''}>Media</option>
                            <option value="G" ${vaga?.tamanho === 'G' ? 'selected' : ''}>Grande</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="vaga-tipo">Tipo *</label>
                    <select id="vaga-tipo" required>
                        <option value="agua" ${vaga?.tipo === 'agua' ? 'selected' : ''}>Na agua</option>
                        <option value="seca" ${vaga?.tipo === 'seca' ? 'selected' : ''}>Seca</option>
                    </select>
                </div>
            </form>
        `;
    },

    showForm(vaga = null) {
        const isEdit = vaga !== null;
        const title = isEdit ? 'Editar Vaga' : 'Nova Vaga';

        Modal.open(title, this.getFormHTML(vaga), {
            onSave: async () => {
                const data = {
                    numero: parseInt(document.getElementById('vaga-numero').value),
                    tamanho: document.getElementById('vaga-tamanho').value,
                    tipo: document.getElementById('vaga-tipo').value,
                    status: vaga?.status || 'livre'
                };

                if (!data.numero) {
                    Utils.showToast('Preencha o numero da vaga', 'error');
                    return;
                }

                try {
                    if (isEdit) {
                        await Database.updateVaga(vaga.id, data);
                        Utils.showToast('Vaga atualizada', 'success');
                    } else {
                        await Database.addVaga(data);
                        Utils.showToast('Vaga cadastrada', 'success');
                    }
                    Modal.close();
                    await this.loadList();
                } catch (error) {
                    Utils.showToast(error.message, 'error');
                }
            },
            onDelete: isEdit ? async () => {
                try {
                    await Database.deleteVaga(vaga.id);
                    Utils.showToast('Vaga excluida', 'success');
                    Modal.close();
                    await this.loadList();
                } catch (error) {
                    Utils.showToast(error.message, 'error');
                }
            } : null
        });
    },

    async showDetail(id) {
        const vaga = await Database.getVaga(id);
        if (!vaga) return;

        const embarcacao = vaga.status === 'ocupada' ? await Database.getEmbarcacaoByVaga(id) : null;
        let cliente = null;
        if (embarcacao && embarcacao.clienteId) {
            cliente = await Database.getCliente(embarcacao.clienteId);
        }

        const html = `
            <div class="detail-section">
                <p><strong>Numero:</strong> ${vaga.numero}</p>
                <p><strong>Tamanho:</strong> ${Utils.tamanhoVagaLabel(vaga.tamanho)}</p>
                <p><strong>Tipo:</strong> ${Utils.tipoVagaLabel(vaga.tipo)}</p>
                <p><strong>Status:</strong>
                    <span class="item-badge badge-${vaga.status}">${Utils.capitalize(vaga.status)}</span>
                </p>
            </div>

            ${embarcacao ? `
                <div class="detail-section mt-16">
                    <h3>Embarcacao</h3>
                    <p><strong>Nome:</strong> ${embarcacao.nome}</p>
                    <p><strong>Tipo:</strong> ${Utils.tipoEmbarcacaoLabel(embarcacao.tipo)}</p>
                    ${cliente ? `<p><strong>Cliente:</strong> ${cliente.nome}</p>` : ''}
                </div>

                ${cliente ? `
                    <div class="mt-16">
                        <a href="${Utils.whatsappLink(cliente.telefone, `Ola ${cliente.nome}! Sobre sua embarcacao ${embarcacao.nome}...`)}"
                           target="_blank" class="btn btn-whatsapp btn-block">
                            Contatar Cliente
                        </a>
                    </div>
                ` : ''}
            ` : ''}

            <div class="mt-16">
                <button type="button" class="btn btn-primary btn-block" id="btn-edit-vaga">
                    Editar Vaga
                </button>
            </div>
        `;

        Modal.open(`Vaga ${vaga.numero}`, html, {
            hideCancel: true
        });

        document.getElementById('btn-edit-vaga').addEventListener('click', () => {
            Modal.close();
            this.showForm(vaga);
        });
    }
};
