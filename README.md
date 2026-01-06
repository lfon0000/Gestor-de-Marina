# Marina Mar - Tijucas SC

Sistema PWA (Progressive Web App) para gestao da Marina Mar. Controle de vagas, embarcacoes, clientes e manutencoes com funcionamento offline e notificacoes via WhatsApp.

## Funcionalidades

- **Dashboard**: Resumo de vagas e manutencoes pendentes/atrasadas
- **Vagas**: Grid visual com status (livre/ocupada)
- **Embarcacoes**: Cadastro com vinculo a cliente e vaga
- **Clientes**: Cadastro com telefone WhatsApp
- **Manutencoes**: Agendamento avulso ou periodico com alertas
- **Backup**: Exportar/importar dados em JSON
- **WhatsApp**: Notificacao de manutencoes via link direto

## Tecnologias

- HTML5, CSS3, JavaScript (vanilla)
- IndexedDB via Dexie.js
- Service Worker para funcionamento offline
- PWA para instalacao no celular

## Deploy no GitHub Pages

### 1. Gerar os icones

Antes de fazer o deploy, gere os icones do app:

1. Abra o arquivo `icons/generate-icons.html` em um navegador
2. Clique em "Baixar" em cada icone para salvar os arquivos PNG
3. Salve todos os icones na pasta `icons/`

### 2. Criar repositorio no GitHub

1. Acesse [github.com](https://github.com) e faca login
2. Clique em "New repository"
3. Nome: `Gestor-de-Marina`
4. Deixe como publico
5. Nao inicialize com README (ja temos)
6. Clique em "Create repository"

### 3. Enviar arquivos

No terminal, na pasta do projeto:

```bash
git init
git add .
git commit -m "Versao inicial do Gestor de Marina"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/Gestor-de-Marina.git
git push -u origin main
```

### 4. Habilitar GitHub Pages

1. No repositorio, va em Settings > Pages
2. Em "Source", selecione "Deploy from a branch"
3. Em "Branch", selecione "main" e "/ (root)"
4. Clique em "Save"
5. Aguarde alguns minutos

### 5. Acessar o app

O app estara disponivel em:
```
https://SEU_USUARIO.github.io/Gestor-de-Marina/
```

## Instalacao no Celular

### Android (Chrome)

1. Abra o link do app no **Chrome**
2. Toque no menu (3 pontinhos no canto superior)
3. Selecione **"Adicionar a tela inicial"**
4. Confirme o nome e toque em "Adicionar"

### iPhone (Safari)

**Importante:** No iPhone, use o **Safari** (nao o Chrome) para instalar o app.

1. Abra o link do app no **Safari**
2. Toque no botao de compartilhar (quadrado com seta para cima)
3. Role a lista e toque em **"Adicionar a Tela de Inicio"**
4. Confirme o nome e toque em "Adicionar"

### Comparativo de Funcionalidades

| Funcionalidade | Android (Chrome) | iPhone (Safari) |
|----------------|------------------|-----------------|
| Instalar como app | Sim | Sim |
| Funcionar offline | Sim | Sim |
| Tela cheia | Sim | Sim |
| Push notifications | Sim | iOS 16.4+ |

**Nota:** O Chrome no iPhone nao permite instalar PWAs - e uma restricao da Apple. Use sempre o Safari no iPhone.

## Backup dos Dados

### Exportar
1. Acesse o menu "Backup"
2. Toque em "Exportar Dados"
3. O arquivo JSON sera baixado
4. Salve no Google Drive, email ou outra nuvem

### Importar
1. Acesse o menu "Backup"
2. Toque em "Selecionar Arquivo"
3. Escolha o arquivo JSON de backup
4. Confirme a importacao

**Atencao**: A importacao substitui todos os dados atuais!

## Estrutura do Projeto

```
Gestor-de-Marina/
├── index.html          # Pagina principal
├── manifest.json       # Configuracao PWA
├── sw.js               # Service Worker
├── README.md           # Este arquivo
├── css/
│   └── style.css       # Estilos responsivos (layout acessivel)
├── js/
│   ├── app.js          # Logica principal e navegacao
│   ├── db.js           # Banco de dados (Dexie/IndexedDB)
│   ├── utils.js        # Funcoes auxiliares e Modal
│   ├── clientes.js     # CRUD de clientes
│   ├── vagas.js        # CRUD de vagas
│   ├── embarcacoes.js  # CRUD de embarcacoes
│   ├── manutencoes.js  # CRUD de manutencoes
│   └── backup.js       # Exportar/Importar JSON
├── logo/
│   └── logo-marina-mar.jpeg  # Logo da Marina Mar
└── icons/
    ├── generate.py     # Gerador de icones (Python)
    └── icon-*.png      # Icones em varios tamanhos
```

## Uso Basico

1. **Cadastrar clientes** primeiro (menu Clientes > botao +)
2. **Cadastrar embarcacoes** vinculando ao cliente (menu Embarcacoes > botao +)
3. **Alocar vaga** ao cadastrar ou editar embarcacao
4. **Agendar manutencoes** para cada embarcacao
5. **Notificar clientes** via WhatsApp quando necessario

## Licenca

Projeto desenvolvido para uso proprio. Sinta-se livre para adaptar.
