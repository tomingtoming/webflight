import { useState, useEffect } from 'react'
import { loadWasmModule } from './utils/wasm-loader'
import { WasmTest } from './components/WasmTest'
import './App.css'

function App() {
  const [wasmReady, setWasmReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wasmInfo, setWasmInfo] = useState<{
    version: string;
    buildInfo: string;
  } | null>(null)

  useEffect(() => {
    const initializeWasm = async () => {
      try {
        console.log('Initializing WebFlight...')
        const wasm = await loadWasmModule()
        
        // Get version information
        const version = wasm.getVersion()
        const buildInfo = wasm.getBuildInfo()
        
        setWasmInfo({ version, buildInfo })
        setWasmReady(true)
        
        // Test basic functionality
        const v1 = new wasm.Vector3(1, 0, 0)
        const v2 = new wasm.Vector3(0, 1, 0)
        const cross = v1.cross(v2)
        console.log('Vector cross product test:', { x: cross.x, y: cross.y, z: cross.z })
        
      } catch (err) {
        console.error('WASM initialization error:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize WASM')
      }
    }

    initializeWasm()
  }, [])

  if (error) {
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (!wasmReady) {
    return (
      <div className="loading-container">
        <h1>Loading WebFlight...</h1>
        <p>Initializing WebAssembly module</p>
      </div>
    )
  }

  return (
    <div className="app">
      <h1>WebFlight</h1>
      <p>YS Flight Simulator - Web Version</p>
      <div className="status">
        <p>✅ WebAssembly Ready</p>
        {wasmInfo && (
          <>
            <p>Version: {wasmInfo.version}</p>
            <p>Build: {wasmInfo.buildInfo}</p>
          </>
        )}
      </div>
      <WasmTest />
      <div className="status">
        <p>🚧 Flight Simulator Coming Soon</p>
      </div>
    </div>
  )
}

export default App