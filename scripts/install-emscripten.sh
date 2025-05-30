#!/bin/bash

# Script to install Emscripten SDK for WebAssembly compilation

EMSDK_DIR="./wasm/emsdk"

if [ -d "$EMSDK_DIR" ]; then
    echo "Emscripten SDK already exists at $EMSDK_DIR"
    echo "Activating..."
    cd $EMSDK_DIR
    source ./emsdk_env.sh
    cd ../..
else
    echo "Installing Emscripten SDK..."
    mkdir -p ./wasm
    cd ./wasm
    
    # Clone emsdk
    git clone https://github.com/emscripten-core/emsdk.git
    cd emsdk
    
    # Install latest SDK
    ./emsdk install latest
    ./emsdk activate latest
    
    # Activate for current session
    source ./emsdk_env.sh
    
    cd ../..
    echo "Emscripten SDK installed successfully!"
fi

echo "Emscripten version:"
emcc --version