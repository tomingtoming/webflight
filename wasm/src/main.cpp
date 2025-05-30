#include <emscripten.h>
#include <emscripten/bind.h>
#include <iostream>

// Main entry point for WASM module
int main() {
    std::cout << "YSFlight WebAssembly Core Initialized" << std::endl;
    return 0;
}