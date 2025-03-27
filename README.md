# The Dude 2.0 - Sistema de Monitoramento de Rede

Sistema moderno de monitoramento de rede inspirado no The Dude da Mikrotik, com interface gráfica intuitiva e suporte a múltiplos protocolos.

## Funcionalidades

- Monitoramento via SNMP e ICMP (ping)
- Interface gráfica com mapa interativo
- Suporte a múltiplos fabricantes (Mikrotik, Cisco, Ubiquiti, Mimosa)
- Sistema de alertas e gatilhos
- Visualização de status em tempo real
- Mapeamento automático de rede

## Requisitos

- Python 3.8+
- Node.js 16+
- PostgreSQL

## Instalação

1. Clone o repositório
2. Instale as dependências Python:
```bash
pip install -r requirements.txt
```

3. Instale as dependências do frontend:
```bash
cd frontend
npm install
```

4. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

5. Inicie o servidor:
```bash
uvicorn app.main:app --reload
```

6. Em outro terminal, inicie o frontend:
```bash
cd frontend
npm run dev
```

## Estrutura do Projeto

```
.
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   └── services/
├── frontend/
│   ├── src/
│   └── public/
└── tests/
```

## Licença

MIT 