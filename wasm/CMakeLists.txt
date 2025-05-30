cmake_minimum_required(VERSION 3.13)
project(ysflight-wasm)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Emscripten settings
if(EMSCRIPTEN)
    set(CMAKE_EXECUTABLE_SUFFIX ".js")
    
    # Base flags
    set(EM_FLAGS "-s WASM=1")
    set(EM_FLAGS "${EM_FLAGS} -s ALLOW_MEMORY_GROWTH=1")
    set(EM_FLAGS "${EM_FLAGS} -s MAXIMUM_MEMORY=512MB")
    set(EM_FLAGS "${EM_FLAGS} -s MODULARIZE=1")
    set(EM_FLAGS "${EM_FLAGS} -s EXPORT_NAME='YSFlightCore'")
    set(EM_FLAGS "${EM_FLAGS} -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap']")
    set(EM_FLAGS "${EM_FLAGS} -s EXPORTED_FUNCTIONS=['_malloc','_free']")
    
    # Enable embind for C++ bindings
    set(EM_FLAGS "${EM_FLAGS} --bind")
    
    # Debug vs Release
    if(CMAKE_BUILD_TYPE STREQUAL "Debug")
        set(EM_FLAGS "${EM_FLAGS} -s ASSERTIONS=2")
        set(EM_FLAGS "${EM_FLAGS} -s SAFE_HEAP=1")
        set(EM_FLAGS "${EM_FLAGS} -gsource-map")
        set(EM_FLAGS "${EM_FLAGS} --source-map-base http://localhost:5173/wasm/")
    else()
        set(EM_FLAGS "${EM_FLAGS} -O3")
        set(EM_FLAGS "${EM_FLAGS} --closure 1")
    endif()
    
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${EM_FLAGS}")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${EM_FLAGS}")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} ${EM_FLAGS}")
endif()

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../../public/src/ysclass/src
    ${CMAKE_CURRENT_SOURCE_DIR}/../../public/src/ysgl/src
)

# Source files
set(SOURCES
    src/main.cpp
    src/bindings.cpp
    src/math_utils.cpp
    src/test_module.cpp
    src/simulation.cpp
    src/simulation_bindings.cpp
)

# Create executable
add_executable(ysflight-core ${SOURCES})

# Copy output to dist folder
if(EMSCRIPTEN)
    set(OUTPUT_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../public)
    add_custom_command(TARGET ysflight-core POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E make_directory ${OUTPUT_DIR}
        COMMAND ${CMAKE_COMMAND} -E copy 
            ${CMAKE_CURRENT_BINARY_DIR}/ysflight-core.js 
            ${OUTPUT_DIR}/ysflight-core.js
        COMMAND ${CMAKE_COMMAND} -E copy 
            ${CMAKE_CURRENT_BINARY_DIR}/ysflight-core.wasm 
            ${OUTPUT_DIR}/ysflight-core.wasm
    )
    
    if(CMAKE_BUILD_TYPE STREQUAL "Debug")
        add_custom_command(TARGET ysflight-core POST_BUILD
            COMMAND ${CMAKE_COMMAND} -E copy 
                ${CMAKE_CURRENT_BINARY_DIR}/ysflight-core.wasm.map 
                ${OUTPUT_DIR}/ysflight-core.wasm.map
        )
    endif()
endif()