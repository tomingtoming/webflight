#include <emscripten.h>
#include <emscripten/bind.h>
#include <iostream>

#ifdef __cplusplus
extern "C" {
#endif

// Main entry point for WASM module
int main() {
    std::cout << "YSFlight WebAssembly Core Initialized" << std::endl;
    return 0;
}

#ifdef __cplusplus
}
#endif