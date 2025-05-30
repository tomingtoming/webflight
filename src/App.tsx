import { useState, useEffect } from 'react'
import { loadWasmModule } from './utils/wasm-loader'
import { WasmTest } from './components/WasmTest'
import { FlightSimulator } from './components/FlightSimulator'
import { FlightSimulation } from './components/FlightSimulation'
import './App.css'

function App() {
  const [wasmReady, setWasmReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wasmInfo, setWasmInfo] = useState<{
    version: string;
    buildInfo: string;
  } | null>(null)
  const [showTests, setShowTests] = useState(false)
  const [showRenderer, setShowRenderer] = useState(false)

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
      
      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={() => setShowTests(!showTests)}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showTests ? 'Hide' : 'Show'} WASM Tests
        </button>
        <button 
          onClick={() => setShowRenderer(!showRenderer)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showRenderer ? 'Hide' : 'Show'} Basic Renderer
        </button>
      </div>
      
      {showTests && <WasmTest />}
      
      {showRenderer && (
        <div style={{ margin: '40px 0' }}>
          <h2>WebGL Renderer Test</h2>
          <FlightSimulator onReady={() => console.log('Renderer initialized')} />
        </div>
      )}
      
      <div style={{ margin: '40px 0' }}>
        <h2>Flight Simulation</h2>
        <FlightSimulation />
      </div>
    </div>
  )
}

export default App