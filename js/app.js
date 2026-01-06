// Main application module

// Dashboard module
const Dashboard = {
    async init() {
        await this.loadStats();
        await this.loadManutencoes();
    },

    async loadStats() {
        const stats = await Database.getStats();

        document.getElementById('stat-vagas-livres').textContent = stats.vagasLivres;
        document.getElementById('stat-vagas-ocupadas').textContent = stats.vagasOcupadas;
        document.getElementById('stat-embarcacoes').textContent = stats.embarcacoes;
        document.getElementById('stat-manutencoes').textContent = stats.manutencoesPendentes;
    },

    async loadManutencoes() {
        // Proximas manutencoes (7 dias)
        const proximas = await Database.getManutencoesPorPeriodo(7);
        const listProximas = document.getElementById('list-manutencoes-proximas');
        const noProximas = document.getElementById('no-manutencoes-proximas');

        if (proximas.length === 0) {
            listProximas.innerHTML = '';
            noProximas.classList.remove('hidden');
        } else {
            noProximas.classList.add('hidden');
            await this.renderManutencoesList(listProximas, proximas);
        }

        // Manutencoes atrasadas
        const atrasadas = await Database.getManutencoesAtrasadas();
        const listAtrasadas = document.getElementById('list-manutencoes-atrasadas');
        const noAtrasadas = document.getElementById('no-manutencoes-atrasadas');

        if (atrasadas.length === 0) {
            listAtrasadas.innerHTML = '';
            noAtrasadas.classList.remove('hidden');
        } else {
            noAtrasadas.classList.add('hidden');
            await this.renderManutencoesList(listAtrasadas, atrasadas, true);
        }
    },

    async renderManutencoesList(listEl, manutencoes, isAtrasada = false) {
        // Get embarcacao and cliente info
        const items = [];
        for (const m of manutencoes) {
            const emb = await Database.getEmbarcacao(m.embarcacaoId);
            let cliente = null;
            if (emb && emb.clienteId) {
                cliente = await Database.getCliente(emb.clienteId);
            }
            items.push({ manutencao: m, embarcacao: emb, cliente });
        }

        listEl.innerHTML = items.map(({ manutencao, embarcacao, cliente }) => {
            const days = Utils.daysUntil(manutencao.proximaData);
            let daysText = '';
            if (days !== null) {
                if (days < 0) {
                    daysText = `${Math.abs(days)}d atras`;
                } else if (days === 0) {
                    daysText = 'Hoje';
                } else if (days === 1) {
                    daysText = 'Amanha';
                } else {
                    daysText = `${days}d`;
                }
            }

            return `
                <li data-id="${manutencao.id}">
                    <div class="item-info">
                        <div class="item-title">${manutencao.tipo}</div>
                        <div class="item-subtitle">
                            ${embarcacao ? embarcacao.nome : 'Embarcacao'}
                            ${cliente ? ` - ${cliente.nome}` : ''}
                        </div>
                    </div>
                    <span class="item-badge badge-${isAtrasada ? 'atrasada' : 'pendente'}">${daysText}</span>
                </li>
            `;
        }).join('');

        // Add click handlers
        listEl.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                const id = parseInt(li.dataset.id);
                Manutencoes.showDetail(id);
            });
        });
    }
};

// Navigation module
const Navigation = {
    currentPage: 'dashboard',

    init() {
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Menu toggle
        document.getElementById('btn-menu').addEventListener('click', () => this.toggleMenu());
        document.getElementById('btn-close-menu').addEventListener('click', () => this.toggleMenu());
        document.getElementById('overlay').addEventListener('click', () => this.toggleMenu());

        // Navigation links
        document.querySelectorAll('.nav-list a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateTo(page);
                this.toggleMenu();
            });
        });

        // Add button
        document.getElementById('btn-add').addEventListener('click', () => this.handleAdd());
    },

    toggleMenu() {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('overlay').classList.toggle('active');
    },

    navigateTo(page) {
        this.currentPage = page;

        // Update active nav link
        document.querySelectorAll('.nav-list a').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        // Update page visibility
        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `page-${page}`);
            p.classList.toggle('hidden', p.id !== `page-${page}`);
        });

        // Update header
        const titles = {
            'dashboard': 'Dashboard',
            'vagas': 'Vagas',
            'embarcacoes': 'Embarcacoes',
            'clientes': 'Clientes',
            'manutencoes': 'Manutencoes',
            'backup': 'Backup'
        };
        document.getElementById('page-title').textContent = titles[page] || 'Marina';

        // Show/hide add button
        const showAdd = ['vagas', 'embarcacoes', 'clientes', 'manutencoes'].includes(page);
        document.getElementById('btn-add').classList.toggle('hidden', !showAdd);

        // Refresh data
        this.refreshPage(page);
    },

    async refreshPage(page) {
        switch (page) {
            case 'dashboard':
                await Dashboard.loadStats();
                await Dashboard.loadManutencoes();
                break;
            case 'vagas':
                await Vagas.loadList();
                break;
            case 'embarcacoes':
                await Embarcacoes.loadList();
                break;
            case 'clientes':
                await Clientes.loadList();
                break;
            case 'manutencoes':
                await Manutencoes.loadList();
                break;
        }
    },

    handleAdd() {
        switch (this.currentPage) {
            case 'vagas':
                Vagas.showForm();
                break;
            case 'embarcacoes':
                Embarcacoes.showForm();
                break;
            case 'clientes':
                Clientes.showForm();
                break;
            case 'manutencoes':
                Manutencoes.showForm();
                break;
        }
    }
};

// App initialization
const App = {
    async init() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registrado:', registration.scope);
            } catch (error) {
                console.error('Erro ao registrar Service Worker:', error);
            }
        }

        // Wait for database initialization
        await new Promise(resolve => setTimeout(resolve, 100));

        // Initialize modules
        Modal.init();
        Navigation.init();
        await Dashboard.init();
        await Clientes.init();
        await Vagas.init();
        await Embarcacoes.init();
        await Manutencoes.init();
        Backup.init();

        console.log('Gestor de Marina inicializado');
    }
};

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
