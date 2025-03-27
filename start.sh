#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log de erro
log_error() {
    local service=$1
    local error=$2
    echo -e "${RED}[ERRO] $service: $error${NC}"
}

# Função para log de sucesso
log_success() {
    local service=$1
    local message=$2
    echo -e "${GREEN}[SUCESSO] $service: $message${NC}"
}

# Função para log de aviso
log_warning() {
    local message=$1
    echo -e "${YELLOW}[AVISO] $message${NC}"
}

# Criar estrutura de diretórios
log_warning "SISTEMA" "Criando estrutura de diretórios..."
mkdir -p backend/app frontend logs

# Verificar se o Python está instalado
if ! command -v python3 &> /dev/null; then
    log_error "SISTEMA" "Python 3 não está instalado. Instalando..."
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip python3-venv
fi

# Instalar python3.10-venv
log_warning "SISTEMA" "Instalando python3.10-venv..."
sudo apt-get update
sudo apt-get install -y python3.10-venv

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    log_error "SISTEMA" "Node.js não está instalado. Instalando..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Criar arquivo requirements.txt se não existir
if [ ! -f "backend/requirements.txt" ]; then
    log_warning "BACKEND" "Criando arquivo requirements.txt..."
    cat > backend/requirements.txt << EOL
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.4.2
pydantic-settings==2.0.3
python-dotenv==1.0.0
pysnmp==4.4.12
EOL
fi

# Criar arquivo main.py se não existir
if [ ! -f "backend/app/main.py" ]; then
    log_warning "BACKEND" "Criando arquivo main.py..."
    cat > backend/app/main.py << EOL
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="The Dude 2.0 API")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "The Dude 2.0 API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOL
fi

# Criar arquivo package.json se não existir
if [ ! -f "frontend/package.json" ]; then
    log_warning "FRONTEND" "Criando arquivo package.json..."
    cat > frontend/package.json << EOL
{
  "name": "the-dude-2.0-frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.14.18",
    "@mui/material": "^5.14.18",
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "@types/jest": "^27.5.2",
    "@types/node": "^16.18.61",
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "axios": "^1.6.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "typescript": "^4.9.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOL
fi

# Instalar dependências do sistema para o easysnmp
log_warning "SISTEMA" "Instalando dependências do sistema..."
sudo apt-get update
sudo apt-get install -y libsnmp-dev snmp-mibs-downloader python3-dev gcc

# Configurar ambiente virtual Python
log_warning "BACKEND" "Configurando ambiente virtual Python..."
cd backend || exit 1
if [ ! -d "venv" ]; then
    python3.10 -m venv venv
fi
source venv/bin/activate

# Instalar dependências Python
log_warning "BACKEND" "Instalando dependências Python..."
pip install --upgrade pip
pip install -r requirements.txt
pip install easysnmp

# Voltar para o diretório raiz
cd ..

# Verificar e instalar dependências do frontend
if [ ! -d "frontend/node_modules" ]; then
    log_warning "FRONTEND" "Instalando dependências do frontend..."
    cd frontend || exit 1
    npm install
    cd ..
fi

# Iniciar o backend
echo "Iniciando o backend..."
cd backend || exit 1
if [ ! -f "venv/bin/activate" ]; then
    log_error "BACKEND" "Ambiente virtual não encontrado"
    exit 1
fi
source venv/bin/activate
cd app || exit 1
python main.py > ../../logs/backend.log 2>&1 &
BACKEND_PID=$!

# Verificar se o backend iniciou corretamente
sleep 2
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    log_error "BACKEND" "Falha ao iniciar. Verifique logs/backend.log para mais detalhes."
    exit 1
fi

# Iniciar o frontend
echo "Iniciando o frontend..."
cd ../../frontend || exit 1
npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Verificar se o frontend iniciou corretamente
sleep 2
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    log_error "FRONTEND" "Falha ao iniciar. Verifique logs/frontend.log para mais detalhes."
    kill $BACKEND_PID
    exit 1
fi

# Função para limpar processos ao sair
cleanup() {
    echo "Encerrando serviços..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Registrar função de cleanup
trap cleanup SIGINT SIGTERM

# Mostrar status dos serviços
echo -e "\n${GREEN}Serviços iniciados com sucesso!${NC}"
echo -e "Frontend: http://localhost:3000"
echo -e "Backend: http://localhost:8000"
echo -e "Documentação da API: http://localhost:8000/docs\n"
echo -e "Logs disponíveis em:"
echo -e "- Backend: logs/backend.log"
echo -e "- Frontend: logs/frontend.log\n"
echo -e "Pressione Ctrl+C para encerrar os serviços\n"

# Manter o script rodando
while true; do
    sleep 1
done 