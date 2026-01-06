// Clientes module

const Clientes = {
    list: [],

    async init() {
        await this.loadList();
        this.setupEventListeners();
    },

    async loadList() {
        this.list = await Database.getAllClientes();
        this.render();
    },

    render() {
        const listEl = document.getElementById('list-clientes');
        const emptyEl = document.getElementById('no-clientes');

        if (this.list.length === 0) {
            listEl.innerHTML = '';
            emptyEl.classList.remove('hidden');
            return;
        }

        emptyEl.classList.add('hidden');

        listEl.innerHTML = this.list.map(cliente => `
            <li data-id="${cliente.id}">
                <div class="item-info">
                    <div class="item-title">${cliente.nome}</div>
                    <div class="item-subtitle">${Utils.formatPhone(cliente.telefone)}</div>
                </div>
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
        const searchInput = document.getElementById('search-clientes');
        searchInput.addEventListener('input', Utils.debounce((e) => {
            this.filterList(e.target.value);
        }, 300));
    },

    filterList(query) {
        const listEl = document.getElementById('list-clientes');
        const items = listEl.querySelectorAll('li');
        const lowerQuery = query.toLowerCase();

        items.forEach(item => {
            const nome = item.querySelector('.item-title').textContent.toLowerCase();
            const visible = nome.includes(lowerQuery);
            item.classList.toggle('hidden', !visible);
        });
    },

    getFormHTML(cliente = null) {
        return `
            <form id="form-cliente">
                <div class="form-group">
                    <label for="cliente-nome">Nome *</label>
                    <input type="text" id="cliente-nome" required value="${cliente?.nome || ''}">
                </div>
                <div class="form-group">
                    <label for="cliente-telefone">Telefone (WhatsApp) *</label>
                    <input type="tel" id="cliente-telefone" required placeholder="(00) 00000-0000" value="${cliente?.telefone || ''}">
                </div>
                <div class="form-group">
                    <label for="cliente-email">Email</label>
                    <input type="email" id="cliente-email" value="${cliente?.email || ''}">
                </div>
                <div class="form-group">
                    <label for="cliente-observacoes">Observacoes</label>
                    <textarea id="cliente-observacoes">${cliente?.observacoes || ''}</textarea>
                </div>
            </form>
        `;
    },

    showForm(cliente = null) {
        const isEdit = cliente !== null;
        const title = isEdit ? 'Editar Cliente' : 'Novo Cliente';

        Modal.open(title, this.getFormHTML(cliente), {
            onSave: async () => {
                const data = {
                    nome: document.getElementById('cliente-nome').value.trim(),
                    telefone: document.getElementById('cliente-telefone').value.trim(),
                    email: document.getElementById('cliente-email').value.trim(),
                    observacoes: document.getElementById('cliente-observacoes').value.trim()
                };

                if (!data.nome || !data.telefone) {
                    Utils.showToast('Preencha os campos obrigatorios', 'error');
                    return;
                }

                try {
                    if (isEdit) {
                        await Database.updateCliente(cliente.id, data);
                        Utils.showToast('Cliente atualizado', 'success');
                    } else {
                        await Database.addCliente(data);
                        Utils.showToast('Cliente cadastrado', 'success');
                    }
                    Modal.close();
                    await this.loadList();
                } catch (error) {
                    Utils.showToast(error.message, 'error');
                }
            },
            onDelete: isEdit ? async () => {
                try {
                    await Database.deleteCliente(cliente.id);
                    Utils.showToast('Cliente excluido', 'success');
                    Modal.close();
                    await this.loadList();
                } catch (error) {
                    Utils.showToast(error.message, 'error');
                }
            } : null
        });
    },

    async showDetail(id) {
        const cliente = await Database.getCliente(id);
        if (!cliente) return;

        const embarcacoes = await Database.getEmbarcacoesByCliente(id);

        const html = `
            <div class="detail-section">
                <p><strong>Nome:</strong> ${cliente.nome}</p>
                <p><strong>Telefone:</strong> ${Utils.formatPhone(cliente.telefone)}</p>
                <p><strong>Email:</strong> ${cliente.email || '-'}</p>
                <p><strong>Observacoes:</strong> ${cliente.observacoes || '-'}</p>
            </div>

            <div class="detail-section mt-16">
                <h3>Embarcacoes (${embarcacoes.length})</h3>
                ${embarcacoes.length > 0 ? `
                    <ul class="item-list">
                        ${embarcacoes.map(e => `
                            <li>
                                <div class="item-info">
                                    <div class="item-title">${e.nome}</div>
                                    <div class="item-subtitle">${Utils.tipoEmbarcacaoLabel(e.tipo)}</div>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                ` : '<p class="empty-message">Nenhuma embarcacao</p>'}
            </div>

            <div class="mt-16">
                <a href="${Utils.whatsappLink(cliente.telefone, 'Ola!')}" target="_blank" class="btn btn-whatsapp btn-block">
                    Abrir WhatsApp
                </a>
            </div>

            <div class="mt-16">
                <button type="button" class="btn btn-primary btn-block" id="btn-edit-cliente">
                    Editar Cliente
                </button>
            </div>
        `;

        Modal.open(cliente.nome, html, {
            hideCancel: true
        });

        document.getElementById('btn-edit-cliente').addEventListener('click', () => {
            Modal.close();
            this.showForm(cliente);
        });
    }
};
