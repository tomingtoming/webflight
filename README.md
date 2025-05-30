# WebFlight

YS Flight Simulator web version using WebAssembly and modern web technologies.

## Overview

WebFlight is a browser-based port of the classic YS Flight Simulator, leveraging WebAssembly for near-native performance and WebGL for hardware-accelerated graphics.

## Technology Stack

- **Core**: WebAssembly (C++ via Emscripten)
- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **Graphics**: WebGL 2.0 (WebGPU ready)
- **State Management**: Zustand
- **3D Library**: Three.js

## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Emscripten SDK (for WASM compilation)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/tomingtoming/webflight.git
cd webflight
```

2. Install dependencies:
```bash
npm install
```

3. Install Emscripten SDK (if not already installed):
```bash
./scripts/install-emscripten.sh
```

## Building the WASM Module

The WebAssembly module needs to be compiled from C++ source:

```bash
# Debug build (with source maps)
npm run build:wasm:debug

# Release build (optimized)
npm run build:wasm:release
```

The compiled WASM files will be placed in the `public/` directory.

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:wasm` - Build WASM module (debug mode)
- `npm run build:wasm:debug` - Build WASM module with debug symbols
- `npm run build:wasm:release` - Build optimized WASM module
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run typecheck` - Check TypeScript types

## Testing

Run the test suite:

```bash
npm test
```

For UI testing:

```bash
npm run test:ui
```

## Project Structure

```
webflight/
├── src/                    # React/TypeScript source
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # State management
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── wasm/                  # C++ WebAssembly source
│   ├── src/               # C++ source files
│   ├── include/           # C++ headers
│   └── CMakeLists.txt     # CMake configuration
├── public/                # Static assets
└── tests/                 # Test files
```

## Current Features

- ✅ WebAssembly module with math utilities
- ✅ Vector3 and Quaternion operations
- ✅ Basic test framework
- 🚧 WebGL renderer (in progress)
- 🚧 Flight physics simulation (planned)
- 🚧 Aircraft models and scenery (planned)

## Browser Compatibility

- Chrome 88+
- Firefox 89+
- Safari 15+
- Edge 88+

WebAssembly and WebGL 2.0 support required.

## Development Status

This project is in active development. Current phase:
- [x] Phase 1: Foundation and project setup
- [x] Phase 2: WebAssembly integration
- [ ] Phase 3: WebGL renderer implementation
- [ ] Phase 4: YSFlight core integration
- [ ] Phase 5: Asset pipeline
- [ ] Phase 6: Multiplayer support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project inherits the license from the original YS Flight Simulator. See LICENSE file for details.

## Acknowledgments

- Original YS Flight Simulator by Soji Yamakawa (CaptainYS)
- Emscripten team for the excellent WebAssembly toolchain
- Three.js community for the 3D graphics library