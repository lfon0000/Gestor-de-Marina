// Backup module

const Backup = {
    init() {
        this.setupEventListeners();
        this.updateLastExportInfo();
    },

    setupEventListeners() {
        document.getElementById('btn-exportar').addEventListener('click', () => this.exportData());
        document.getElementById('btn-importar').addEventListener('click', () => {
            document.getElementById('input-importar').click();
        });
        document.getElementById('input-importar').addEventListener('change', (e) => this.importData(e));
    },

    async exportData() {
        try {
            const data = await Database.exportAllData();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const date = new Date().toISOString().split('T')[0];
            const filename = `marina-backup-${date}.json`;

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Save last export date
            localStorage.setItem('lastExport', new Date().toISOString());
            this.updateLastExportInfo();

            Utils.showToast('Dados exportados com sucesso', 'success');
        } catch (error) {
            Utils.showToast('Erro ao exportar dados', 'error');
            console.error(error);
        }
    },

    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const confirmed = confirm('Tem certeza que deseja importar? Todos os dados atuais serao substituidos!');
        if (!confirmed) {
            event.target.value = '';
            return;
        }

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            await Database.importAllData(data);

            Utils.showToast('Dados importados com sucesso', 'success');

            // Reload all modules
            await Clientes.loadList();
            await Vagas.loadList();
            await Embarcacoes.loadList();
            await Manutencoes.loadList();
            await Dashboard.loadStats();

        } catch (error) {
            Utils.showToast('Erro ao importar: ' + error.message, 'error');
            console.error(error);
        }

        event.target.value = '';
    },

    updateLastExportInfo() {
        const lastExport = localStorage.getItem('lastExport');
        const infoEl = document.getElementById('last-export');

        if (lastExport) {
            const date = new Date(lastExport);
            infoEl.textContent = `Ultimo backup: ${Utils.formatDate(lastExport)} as ${date.toLocaleTimeString('pt-BR')}`;
        } else {
            infoEl.textContent = 'Nenhum backup realizado ainda';
        }
    }
};
