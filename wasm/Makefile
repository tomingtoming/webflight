.PHONY: all debug release clean setup

BUILD_DIR_DEBUG = build/debug
BUILD_DIR_RELEASE = build/release

all: debug

setup:
	@echo "Checking for Emscripten..."
	@which emcc > /dev/null || (echo "Error: Emscripten not found. Please install emsdk." && exit 1)

debug: setup
	@echo "Building debug version..."
	@mkdir -p $(BUILD_DIR_DEBUG)
	cd $(BUILD_DIR_DEBUG) && emcmake cmake ../.. -DCMAKE_BUILD_TYPE=Debug
	cd $(BUILD_DIR_DEBUG) && emmake make

release: setup
	@echo "Building release version..."
	@mkdir -p $(BUILD_DIR_RELEASE)
	cd $(BUILD_DIR_RELEASE) && emcmake cmake ../.. -DCMAKE_BUILD_TYPE=Release
	cd $(BUILD_DIR_RELEASE) && emmake make

clean:
	@echo "Cleaning build directories..."
	rm -rf build
	rm -f ../public/ysflight-core.*

test: debug
	@echo "Running tests..."
	cd .. && npm test