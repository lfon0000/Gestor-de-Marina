// Utility functions

const Utils = {
    // Format date for display
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    },

    // Format date for input
    formatDateInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    },

    // Parse date from input
    parseDate(inputValue) {
        if (!inputValue) return null;
        return new Date(inputValue + 'T00:00:00').toISOString();
    },

    // Format phone for display
    formatPhone(phone) {
        if (!phone) return '-';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
        } else if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
        }
        return phone;
    },

    // Clean phone for WhatsApp
    cleanPhone(phone) {
        return phone.replace(/\D/g, '');
    },

    // Generate WhatsApp link
    whatsappLink(phone, message) {
        const cleanedPhone = this.cleanPhone(phone);
        const phoneWithCountry = cleanedPhone.startsWith('55') ? cleanedPhone : '55' + cleanedPhone;
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${phoneWithCountry}?text=${encodedMessage}`;
    },

    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('active');

        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    },

    // Capitalize first letter
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // Tipo de embarcacao labels
    tipoEmbarcacaoLabel(tipo) {
        const labels = {
            'lancha': 'Lancha',
            'jet-ski': 'Jet Ski',
            'veleiro': 'Veleiro',
            'iate': 'Iate',
            'barco': 'Barco'
        };
        return labels[tipo] || tipo;
    },

    // Tamanho vaga labels
    tamanhoVagaLabel(tamanho) {
        const labels = {
            'P': 'Pequena',
            'M': 'Media',
            'G': 'Grande'
        };
        return labels[tamanho] || tamanho;
    },

    // Tipo vaga labels
    tipoVagaLabel(tipo) {
        const labels = {
            'agua': 'Na agua',
            'seca': 'Seca'
        };
        return labels[tipo] || tipo;
    },

    // Status manutencao labels
    statusManutencaoLabel(status) {
        const labels = {
            'pendente': 'Pendente',
            'atrasada': 'Atrasada',
            'concluida': 'Concluida'
        };
        return labels[status] || status;
    },

    // Days until date
    daysUntil(dateString) {
        if (!dateString) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dateString);
        target.setHours(0, 0, 0, 0);
        const diff = target - today;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Modal management
const Modal = {
    element: null,
    titleEl: null,
    bodyEl: null,
    saveBtn: null,
    deleteBtn: null,
    cancelBtn: null,
    closeBtn: null,
    onSave: null,
    onDelete: null,

    init() {
        this.element = document.getElementById('modal');
        this.titleEl = document.getElementById('modal-title');
        this.bodyEl = document.getElementById('modal-body');
        this.saveBtn = document.getElementById('btn-modal-save');
        this.deleteBtn = document.getElementById('btn-modal-delete');
        this.cancelBtn = document.getElementById('btn-modal-cancel');
        this.closeBtn = document.getElementById('btn-close-modal');

        this.closeBtn.addEventListener('click', () => this.close());
        this.cancelBtn.addEventListener('click', () => this.close());
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) this.close();
        });

        this.saveBtn.addEventListener('click', () => {
            if (this.onSave) this.onSave();
        });

        this.deleteBtn.addEventListener('click', () => {
            if (this.onDelete && confirm('Tem certeza que deseja excluir?')) {
                this.onDelete();
            }
        });
    },

    open(title, content, options = {}) {
        this.titleEl.textContent = title;
        this.bodyEl.innerHTML = content;
        this.onSave = options.onSave || null;
        this.onDelete = options.onDelete || null;

        this.saveBtn.textContent = options.saveText || 'Salvar';
        this.saveBtn.classList.toggle('hidden', !options.onSave || options.hideSave);
        this.deleteBtn.classList.toggle('hidden', !options.onDelete);
        this.cancelBtn.classList.toggle('hidden', options.hideCancel);

        this.element.classList.add('active');
    },

    close() {
        this.element.classList.remove('active');
        this.onSave = null;
        this.onDelete = null;
    }
};
