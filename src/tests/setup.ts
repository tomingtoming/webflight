import '@testing-library/jest-dom'

// Mock WebAssembly if not available
if (typeof WebAssembly === 'undefined') {
  (globalThis as any).WebAssembly = {
    instantiate: () => Promise.resolve({}),
    compile: () => Promise.resolve({}),
    Module: class {},
    Instance: class {},
  }
}