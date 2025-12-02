#!/usr/bin/env bash

set -e

# Última versão conhecida do GAI CLI
VERSION="0.5.0"
URL="https://github.com/google-gemini/gemini-cli/releases/download/v${VERSION}/gai-linux-amd64"

INSTALL_DIR="$HOME/.local/bin"
mkdir -p "$INSTALL_DIR"

echo "Baixando GAI CLI v$VERSION..."
curl -L "$URL" -o "$INSTALL_DIR/gai"

chmod +x "$INSTALL_DIR/gai"

echo "GAI instalado em $INSTALL_DIR/gai"

# Confirma PATH
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    echo "PATH atualizado — abra um novo terminal ou rode: source ~/.bashrc"
fi

echo "Instalação concluída! Teste com: gai --help"
