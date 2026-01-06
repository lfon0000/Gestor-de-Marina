// Manutencoes module

const Manutencoes = {
    list: [],

    async init() {
        await this.loadList();
        this.setupEventListeners();
    },

    async loadList() {
        this.list = await Database.getAllManutencoes();
        // Update status based on dates
        await Database.getManutencoesPendentes();
        this.list = await Database.getAllManutencoes();
        await this.render();
    },

    async render(filterStatus = '') {
        const listEl = document.getElementById('list-manutencoes');
        const emptyEl = document.getElementById('no-manutencoes');

        let filtered = this.list;
        if (filterStatus) {
            filtered = this.list.filter(m => m.status === filterStatus);
        }

        // Sort by date (nearest first, then overdue)
        filtered.sort((a, b) => {
            if (!a.proximaData) return 1;
            if (!b.proximaData) return -1;
            return new Date(a.proximaData) - new Date(b.proximaData);
        });

        if (filtered.length === 0) {
            listEl.innerHTML = '';
            emptyEl.classList.remove('hidden');
            return;
        }

        emptyEl.classList.add('hidden');

        // Get embarcacao names
        const embarcacoesMap = {};
        for (const m of filtered) {
            if (m.embarcacaoId && !embarcacoesMap[m.embarcacaoId]) {
                const emb = await Database.getEmbarcacao(m.embarcacaoId);
                if (emb) embarcacoesMap[m.embarcacaoId] = emb.nome;
            }
        }

        listEl.innerHTML = filtered.map(m => {
            const days = Utils.daysUntil(m.proximaData);
            let daysText = '';
            if (days !== null) {
                if (days < 0) {
                    daysText = `${Math.abs(days)} dias atrasada`;
                } else if (days === 0) {
                    daysText = 'Hoje';
                } else if (days === 1) {
                    daysText = 'Amanha';
                } else {
                    daysText = `Em ${days} dias`;
                }
            }

            return `
                <li data-id="${m.id}">
                    <div class="item-info">
                        <div class="item-title">${m.tipo}</div>
                        <div class="item-subtitle">
                            ${embarcacoesMap[m.embarcacaoId] || 'Embarcacao'}
                            ${m.proximaData ? ` - ${Utils.formatDate(m.proximaData)}` : ''}
                            ${daysText ? ` (${daysText})` : ''}
                        </div>
                    </div>
                    <span class="item-badge badge-${m.status}">${Utils.capitalize(m.status)}</span>
                </li>
            `;
        }).join('');

        // Add click handlers
        listEl.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                const id = parseInt(li.dataset.id);
                this.showDetail(id);
            });
        });
    },

    setupEventListeners() {
        const filterSelect = document.getElementById('filter-status-manutencao');
        filterSelect.addEventListener('change', (e) => {
            this.render(e.target.value);
        });
    },

    async getFormHTML(manutencao = null, embarcacaoId = null) {
        const embarcacoes = await Database.getAllEmbarcacoes();

        const selectedEmbId = manutencao?.embarcacaoId || embarcacaoId || '';

        return `
            <form id="form-manutencao">
                <div class="form-group">
                    <label for="manut-embarcacao">Embarcacao *</label>
                    <select id="manut-embarcacao" required>
                        <option value="">Selecione</option>
                        ${embarcacoes.map(e => `
                            <option value="${e.id}" ${selectedEmbId === e.id ? 'selected' : ''}>
                                ${e.nome}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label for="manut-tipo">Tipo de Manutencao *</label>
                    <select id="manut-tipo" required>
                        <option value="">Selecione</option>
                        <option value="Revisao do motor" ${manutencao?.tipo === 'Revisao do motor' ? 'selected' : ''}>Revisao do motor</option>
                        <option value="Troca de oleo" ${manutencao?.tipo === 'Troca de oleo' ? 'selected' : ''}>Troca de oleo</option>
                        <option value="Limpeza do casco" ${manutencao?.tipo === 'Limpeza do casco' ? 'selected' : ''}>Limpeza do casco</option>
                        <option value="Pintura" ${manutencao?.tipo === 'Pintura' ? 'selected' : ''}>Pintura</option>
                        <option value="Verificacao eletrica" ${manutencao?.tipo === 'Verificacao eletrica' ? 'selected' : ''}>Verificacao eletrica</option>
                        <option value="Manutencao preventiva" ${manutencao?.tipo === 'Manutencao preventiva' ? 'selected' : ''}>Manutencao preventiva</option>
                        <option value="Outro" ${manutencao?.tipo === 'Outro' ? 'selected' : ''}>Outro</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="manut-descricao">Descricao</label>
                    <textarea id="manut-descricao">${manutencao?.descricao || ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="manut-proxima-data">Proxima Data *</label>
                        <input type="date" id="manut-proxima-data" required
                               value="${Utils.formatDateInput(manutencao?.proximaData)}">
                    </div>
                    <div class="form-group">
                        <label for="manut-intervalo">Repetir a cada (meses)</label>
                        <input type="number" id="manut-intervalo" min="0" max="60"
                               value="${manutencao?.intervaloMeses || ''}"
                               placeholder="0 = nao repetir">
                    </div>
                </div>

                ${manutencao ? `
                    <div class="form-group">
                        <label for="manut-status">Status</label>
                        <select id="manut-status">
                            <option value="pendente" ${manutencao?.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                            <option value="concluida" ${manutencao?.status === 'concluida' ? 'selected' : ''}>Concluida</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="manut-data-realizada">Data Realizada</label>
                        <input type="date" id="manut-data-realizada"
                               value="${Utils.formatDateInput(manutencao?.dataRealizada)}">
                    </div>
                ` : ''}
            </form>
        `;
    },

    async showForm(manutencao = null, embarcacaoId = null) {
        const isEdit = manutencao !== null;
        const title = isEdit ? 'Editar Manutencao' : 'Nova Manutencao';
        const formHTML = await this.getFormHTML(manutencao, embarcacaoId);

        Modal.open(title, formHTML, {
            onSave: async () => {
                const statusEl = document.getElementById('manut-status');
                const dataRealizadaEl = document.getElementById('manut-data-realizada');

                const data = {
                    embarcacaoId: parseInt(document.getElementById('manut-embarcacao').value) || null,
                    tipo: document.getElementById('manut-tipo').value,
                    descricao: document.getElementById('manut-descricao').value.trim(),
                    proximaData: Utils.parseDate(document.getElementById('manut-proxima-data').value),
                    intervaloMeses: parseInt(document.getElementById('manut-intervalo').value) || 0,
                    status: statusEl ? statusEl.value : 'pendente',
                    dataRealizada: dataRealizadaEl ? Utils.parseDate(dataRealizadaEl.value) : null
                };

                if (!data.embarcacaoId || !data.tipo || !data.proximaData) {
                    Utils.showToast('Preencha os campos obrigatorios', 'error');
                    return;
                }

                try {
                    if (isEdit) {
                        await Database.updateManutencao(manutencao.id, data);
                        Utils.showToast('Manutencao atualizada', 'success');

                        // If completed and has interval, create next maintenance
                        if (data.status === 'concluida' && data.intervaloMeses > 0 && manutencao.status !== 'concluida') {
                            const nextDate = new Date(data.proximaData);
                            nextDate.setMonth(nextDate.getMonth() + data.intervaloMeses);

                            await Database.addManutencao({
                                embarcacaoId: data.embarcacaoId,
                                tipo: data.tipo,
                                descricao: data.descricao,
                                proximaData: nextDate.toISOString(),
                                intervaloMeses: data.intervaloMeses,
                                status: 'pendente',
                                dataRealizada: null
                            });
                            Utils.showToast('Proxima manutencao agendada', 'success');
                        }
                    } else {
                        await Database.addManutencao(data);
                        Utils.showToast('Manutencao cadastrada', 'success');
                    }
                    Modal.close();
                    await this.loadList();
                    await Dashboard.loadStats();
                } catch (error) {
                    Utils.showToast(error.message, 'error');
                }
            },
            onDelete: isEdit ? async () => {
                try {
                    await Database.deleteManutencao(manutencao.id);
                    Utils.showToast('Manutencao excluida', 'success');
                    Modal.close();
                    await this.loadList();
                    await Dashboard.loadStats();
                } catch (error) {
                    Utils.showToast(error.message, 'error');
                }
            } : null
        });
    },

    async showDetail(id) {
        const manutencao = await Database.getManutencao(id);
        if (!manutencao) return;

        const embarcacao = manutencao.embarcacaoId ? await Database.getEmbarcacao(manutencao.embarcacaoId) : null;
        let cliente = null;
        if (embarcacao && embarcacao.clienteId) {
            cliente = await Database.getCliente(embarcacao.clienteId);
        }

        const days = Utils.daysUntil(manutencao.proximaData);
        let daysText = '';
        if (days !== null && manutencao.status !== 'concluida') {
            if (days < 0) {
                daysText = `(${Math.abs(days)} dias atrasada)`;
            } else if (days === 0) {
                daysText = '(Hoje)';
            } else {
                daysText = `(Em ${days} dias)`;
            }
        }

        const html = `
            <div class="detail-section">
                <p><strong>Tipo:</strong> ${manutencao.tipo}</p>
                <p><strong>Embarcacao:</strong> ${embarcacao ? embarcacao.nome : '-'}</p>
                <p><strong>Cliente:</strong> ${cliente ? cliente.nome : '-'}</p>
                <p><strong>Proxima Data:</strong> ${Utils.formatDate(manutencao.proximaData)} ${daysText}</p>
                <p><strong>Intervalo:</strong> ${manutencao.intervaloMeses ? `A cada ${manutencao.intervaloMeses} meses` : 'Nao repetir'}</p>
                <p><strong>Status:</strong>
                    <span class="item-badge badge-${manutencao.status}">${Utils.capitalize(manutencao.status)}</span>
                </p>
                ${manutencao.dataRealizada ? `<p><strong>Data Realizada:</strong> ${Utils.formatDate(manutencao.dataRealizada)}</p>` : ''}
                ${manutencao.descricao ? `<p><strong>Descricao:</strong> ${manutencao.descricao}</p>` : ''}
            </div>

            ${cliente && manutencao.status !== 'concluida' ? `
                <div class="mt-16">
                    <a href="${Utils.whatsappLink(cliente.telefone, this.getWhatsAppMessage(cliente, embarcacao, manutencao))}"
                       target="_blank" class="btn btn-whatsapp btn-block">
                        Notificar Cliente via WhatsApp
                    </a>
                </div>
            ` : ''}

            <div class="mt-16">
                <button type="button" class="btn btn-primary btn-block" id="btn-edit-manutencao">
                    Editar Manutencao
                </button>
            </div>

            ${manutencao.status !== 'concluida' ? `
                <div class="mt-16">
                    <button type="button" class="btn btn-secondary btn-block" id="btn-concluir-manutencao">
                        Marcar como Concluida
                    </button>
                </div>
            ` : ''}
        `;

        Modal.open(manutencao.tipo, html, {
            hideCancel: true
        });

        document.getElementById('btn-edit-manutencao').addEventListener('click', () => {
            Modal.close();
            this.showForm(manutencao);
        });

        const concluirBtn = document.getElementById('btn-concluir-manutencao');
        if (concluirBtn) {
            concluirBtn.addEventListener('click', async () => {
                try {
                    const today = new Date().toISOString();
                    await Database.updateManutencao(manutencao.id, {
                        status: 'concluida',
                        dataRealizada: today
                    });

                    // If has interval, create next maintenance
                    if (manutencao.intervaloMeses > 0) {
                        const nextDate = new Date(manutencao.proximaData);
                        nextDate.setMonth(nextDate.getMonth() + manutencao.intervaloMeses);

                        await Database.addManutencao({
                            embarcacaoId: manutencao.embarcacaoId,
                            tipo: manutencao.tipo,
                            descricao: manutencao.descricao,
                            proximaData: nextDate.toISOString(),
                            intervaloMeses: manutencao.intervaloMeses,
                            status: 'pendente',
                            dataRealizada: null
                        });
                        Utils.showToast('Proxima manutencao agendada', 'success');
                    }

                    Utils.showToast('Manutencao concluida', 'success');
                    Modal.close();
                    await this.loadList();
                    await Dashboard.loadStats();
                } catch (error) {
                    Utils.showToast(error.message, 'error');
                }
            });
        }
    },

    getWhatsAppMessage(cliente, embarcacao, manutencao) {
        const dataFormatada = Utils.formatDate(manutencao.proximaData);
        return `Ola ${cliente.nome}! Sua embarcacao ${embarcacao.nome} tem manutencao de "${manutencao.tipo}" agendada para ${dataFormatada}. Entre em contato para agendar o servico.`;
    }
};
