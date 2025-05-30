#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/version.h>
#include <string>

using namespace emscripten;

// Version information
std::string getVersion() {
    return "0.1.0";
}

std::string getBuildInfo() {
    return std::string("WebFlight WASM Core - Built with Emscripten ") + 
           std::to_string(__EMSCRIPTEN_major__) + "." +
           std::to_string(__EMSCRIPTEN_minor__) + "." +
           std::to_string(__EMSCRIPTEN_tiny__);
}

// System information
val getSystemInfo() {
    val info = val::object();
    info.set("platform", val("web"));
    info.set("wasmSupported", val(true));
    info.set("threadsSupported", val(false)); // Will be enabled later
    info.set("simdSupported", val(false));    // Will be enabled later
    
    // Memory info
    val memory = val::object();
    // Get heap size using EM_ASM
    int heapSize = EM_ASM_INT({
        return HEAP8.length;
    });
    memory.set("heapSize", val(heapSize));
    memory.set("stackSize", val(65536)); // Default stack size
    info.set("memory", memory);
    
    return info;
}

// Main bindings
EMSCRIPTEN_BINDINGS(ysflight_core) {
    function("getVersion", &getVersion);
    function("getBuildInfo", &getBuildInfo);
    function("getSystemInfo", &getSystemInfo);
}