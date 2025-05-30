import type { YSFlightCore } from '@/types/wasm'

// Declare the global YSFlightCore that will be loaded
declare global {
  interface Window {
    YSFlightCore?: any;
  }
}

let wasmModule: YSFlightCore | null = null;
let initPromise: Promise<YSFlightCore> | null = null;

export async function loadWasmModule(): Promise<YSFlightCore> {
  // Return existing module if already loaded
  if (wasmModule) {
    return wasmModule;
  }
  
  // Return existing promise if initialization is in progress
  if (initPromise) {
    return initPromise;
  }
  
  // Start initialization
  initPromise = (async () => {
    try {
      // Load the script dynamically
      const script = document.createElement('script');
      script.src = '/ysflight-core.js';
      
      // Wait for script to load
      await new Promise<void>((scriptResolve, scriptReject) => {
        script.onload = () => scriptResolve();
        script.onerror = () => scriptReject(new Error('Failed to load WASM script'));
        document.head.appendChild(script);
      });
      
      // Check if YSFlightCore is available
      if (!window.YSFlightCore) {
        throw new Error('YSFlightCore not found after loading script');
      }
      
      // Initialize the module
      const module = await window.YSFlightCore({
        locateFile: (path: string) => {
          if (path.endsWith('.wasm')) {
            return '/ysflight-core.wasm';
          }
          return path;
        },
        onRuntimeInitialized: () => {
          console.log('WASM Runtime initialized successfully');
        }
      });
      
      wasmModule = module;
      return module;
    } catch (error) {
      console.error('Failed to load WASM module:', error);
      throw error;
    }
  })();
  
  return initPromise;
}

export function getWasmModule(): YSFlightCore | null {
  return wasmModule;
}

export function isWasmReady(): boolean {
  return wasmModule !== null;
}