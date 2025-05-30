import { useEffect, useState } from 'react'
import { getWasmModule } from '@/utils/wasm-loader'

export function WasmTest() {
  const [tests, setTests] = useState<string[]>([])
  
  useEffect(() => {
    const runTests = () => {
      const wasm = getWasmModule()
      if (!wasm) {
        setTests(['WASM module not loaded yet'])
        return
      }
      
      const results: string[] = []
      
      try {
        // Test version
        results.push(`✅ Version: ${wasm.getVersion()}`)
        
        // Test build info
        results.push(`✅ Build: ${wasm.getBuildInfo()}`)
        
        // Test Vector3
        const v1 = new wasm.Vector3(1, 2, 3)
        const v2 = new wasm.Vector3(4, 5, 6)
        const v3 = v1.add(v2)
        results.push(`✅ Vector3: (${v1.x}, ${v1.y}, ${v1.z}) + (${v2.x}, ${v2.y}, ${v2.z}) = (${v3.x}, ${v3.y}, ${v3.z})`)
        
        // Test length
        const length = v1.length()
        results.push(`✅ Length: ||(1, 2, 3)|| = ${length.toFixed(3)}`)
        
        // Test math functions
        const deg = 180
        const rad = wasm.degToRad(deg)
        results.push(`✅ Math: ${deg}° = ${rad.toFixed(3)} rad`)
        
        // Test Quaternion
        const axis = new wasm.Vector3(0, 1, 0)
        const q = wasm.Quaternion.fromAxisAngle(axis, Math.PI / 2)
        results.push(`✅ Quaternion: rotation around Y axis by 90° (w=${q.w.toFixed(3)}, x=${q.x.toFixed(3)}, y=${q.y.toFixed(3)}, z=${q.z.toFixed(3)})`)
        
        // Test TestModule
        const test = new wasm.TestModule('WebFlight')
        results.push(`✅ TestModule: ${test.getName()}`)
        test.incrementCounter()
        test.incrementCounter()
        results.push(`✅ Counter: ${test.getCounter()}`)
        
      } catch (error) {
        results.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      
      setTests(results)
    }
    
    // Run tests after a short delay to ensure WASM is loaded
    const timer = setTimeout(runTests, 100)
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <div style={{ margin: '20px', fontFamily: 'monospace' }}>
      <h2>WASM Functionality Tests</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {tests.map((test, index) => (
          <li key={index} style={{ margin: '5px 0' }}>{test}</li>
        ))}
      </ul>
    </div>
  )
}