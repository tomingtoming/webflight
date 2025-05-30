import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { SimulationRenderer } from '@/renderer/SimulationRenderer'
import { getWasmModule } from '@/utils/wasm-loader'
import type { FlightSimulation, AircraftState } from '@/types/wasm'
import './FlightSimulation.css'

export function FlightSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<SimulationRenderer | null>(null)
  const simulationRef = useRef<FlightSimulation | null>(null)
  const animationIdRef = useRef<number | null>(null)
  
  const [isRunning, setIsRunning] = useState(false)
  const [aircraftState, setAircraftState] = useState<AircraftState | null>(null)
  const [controls, setControls] = useState({
    throttle: 0.5,
    aileron: 0,
    elevator: 0,
    rudder: 0
  })
  
  // Initialize simulation
  useEffect(() => {
    if (!canvasRef.current) return
    
    const wasm = getWasmModule()
    if (!wasm) {
      console.error('WASM module not loaded')
      return
    }
    
    // Create renderer
    const renderer = new SimulationRenderer(canvasRef.current)
    rendererRef.current = renderer
    renderer.start()
    
    // Add terrain
    renderer.addTerrain()
    
    // Create flight simulation
    const sim = new wasm.FlightSimulation()
    simulationRef.current = sim
    
    // Initialize aircraft at 1000m altitude
    sim.initialize(0, 1000, 0, 0)
    sim.setAircraftType('F-16')
    
    // Add aircraft to renderer
    renderer.addAircraft('player', new THREE.Vector3(0, 1000, 0))
    
    // Set initial camera position
    renderer.setCameraPosition(50, 1030, 50)
    renderer.setCameraTarget(0, 1000, 0)
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      renderer.dispose()
    }
  }, [])
  
  // Update controls
  useEffect(() => {
    if (simulationRef.current) {
      simulationRef.current.setThrottle(controls.throttle)
      simulationRef.current.setControlSurfaces(
        controls.aileron,
        controls.elevator,
        controls.rudder
      )
    }
  }, [controls])
  
  // Simulation loop
  useEffect(() => {
    if (!isRunning || !simulationRef.current || !rendererRef.current) return
    
    let lastTime = performance.now()
    
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000 // Convert to seconds
      lastTime = currentTime
      
      // Update simulation
      simulationRef.current!.update(deltaTime)
      
      // Get state
      const state = simulationRef.current!.getState()
      setAircraftState(state)
      
      // Update renderer
      const position = new THREE.Vector3(state.position.x, state.position.y, state.position.z)
      const rotation = new THREE.Euler(state.pitch, state.heading, state.roll, 'YXZ')
      const velocity = new THREE.Vector3(state.velocity.x, state.velocity.y, state.velocity.z)
      
      rendererRef.current!.updateAircraft('player', position, rotation, velocity)
      
      // Follow aircraft with camera
      rendererRef.current!.followAircraft('player', 50)
      
      animationIdRef.current = requestAnimationFrame(animate)
    }
    
    animate(performance.now())
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = null
      }
    }
  }, [isRunning])
  
  const handleStartStop = () => {
    setIsRunning(!isRunning)
  }
  
  const handleReset = () => {
    if (simulationRef.current && rendererRef.current) {
      setIsRunning(false)
      simulationRef.current.reset()
      simulationRef.current.initialize(0, 1000, 0, 0)
      
      // Reset aircraft position in renderer
      const position = new THREE.Vector3(0, 1000, 0)
      const rotation = new THREE.Euler(0, 0, 0)
      const velocity = new THREE.Vector3(100, 0, 0)
      rendererRef.current.updateAircraft('player', position, rotation, velocity)
      
      // Reset camera
      rendererRef.current.setCameraPosition(50, 1030, 50)
      rendererRef.current.setCameraTarget(0, 1000, 0)
      
      // Reset controls
      setControls({
        throttle: 0.5,
        aileron: 0,
        elevator: 0,
        rudder: 0
      })
    }
  }
  
  return (
    <div className="flight-simulation-container">
      <canvas ref={canvasRef} className="flight-canvas" />
      
      <div className="flight-controls-panel">
        <h3>Flight Controls</h3>
        
        <div className="control-buttons">
          <button 
            onClick={handleStartStop}
            className={isRunning ? 'stop-button' : 'start-button'}
          >
            {isRunning ? '⏸️ Pause' : '▶️ Start'}
          </button>
          <button onClick={handleReset} className="reset-button">
            🔄 Reset
          </button>
        </div>
        
        <div className="control-sliders">
          <div className="control-slider">
            <label>Throttle: {(controls.throttle * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={controls.throttle}
              onChange={(e) => setControls({ ...controls, throttle: parseFloat(e.target.value) })}
            />
          </div>
          
          <div className="control-slider">
            <label>Aileron (Roll): {(controls.aileron * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={controls.aileron}
              onChange={(e) => setControls({ ...controls, aileron: parseFloat(e.target.value) })}
            />
          </div>
          
          <div className="control-slider">
            <label>Elevator (Pitch): {(controls.elevator * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={controls.elevator}
              onChange={(e) => setControls({ ...controls, elevator: parseFloat(e.target.value) })}
            />
          </div>
          
          <div className="control-slider">
            <label>Rudder (Yaw): {(controls.rudder * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={controls.rudder}
              onChange={(e) => setControls({ ...controls, rudder: parseFloat(e.target.value) })}
            />
          </div>
        </div>
        
        {aircraftState && (
          <div className="flight-status">
            <h4>Flight Status</h4>
            <div className="status-grid">
              <div>Altitude: {aircraftState.altitude.toFixed(1)} m</div>
              <div>Airspeed: {aircraftState.airspeed.toFixed(1)} m/s</div>
              <div>Heading: {(aircraftState.heading * 180 / Math.PI).toFixed(1)}°</div>
              <div>Pitch: {(aircraftState.pitch * 180 / Math.PI).toFixed(1)}°</div>
              <div>Roll: {(aircraftState.roll * 180 / Math.PI).toFixed(1)}°</div>
              <div>Fuel: {aircraftState.fuel.toFixed(0)} kg</div>
            </div>
          </div>
        )}
        
        <div className="control-help">
          <h4>Keyboard Controls</h4>
          <p>Coming soon: Arrow keys for control</p>
        </div>
      </div>
    </div>
  )
}