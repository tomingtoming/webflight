import { useEffect, useRef, useState } from 'react'
import { WebGLRenderer } from '@/renderer/WebGLRenderer'
import './FlightSimulator.css'

interface FlightSimulatorProps {
  onReady?: () => void
}

export function FlightSimulator({ onReady }: FlightSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<WebGLRenderer | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [showAxes, setShowAxes] = useState(true)
  const [fps, setFps] = useState(0)
  
  useEffect(() => {
    if (!canvasRef.current) return
    
    // Initialize renderer
    const renderer = new WebGLRenderer(canvasRef.current, {
      antialias: true,
      shadows: true,
      maxFPS: 60
    })
    
    rendererRef.current = renderer
    renderer.start()
    setIsInitialized(true)
    
    // FPS counter
    let frameCount = 0
    let lastTime = performance.now()
    
    const updateFPS = () => {
      frameCount++
      const currentTime = performance.now()
      const delta = currentTime - lastTime
      
      if (delta >= 1000) {
        setFps(Math.round((frameCount * 1000) / delta))
        frameCount = 0
        lastTime = currentTime
      }
    }
    
    const fpsInterval = setInterval(updateFPS, 16)
    
    if (onReady) {
      onReady()
    }
    
    // Cleanup
    return () => {
      clearInterval(fpsInterval)
      if (rendererRef.current) {
        rendererRef.current.dispose()
        rendererRef.current = null
      }
    }
  }, [onReady])
  
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setShowGrid(showGrid)
    }
  }, [showGrid])
  
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setShowAxes(showAxes)
    }
  }, [showAxes])
  
  const handleResetCamera = () => {
    if (rendererRef.current) {
      rendererRef.current.setCameraPosition(50, 30, 50)
      rendererRef.current.setCameraTarget(0, 0, 0)
    }
  }
  
  return (
    <div className="flight-simulator">
      <canvas 
        ref={canvasRef}
        className="flight-canvas"
      />
      
      <div className="flight-controls">
        <div className="control-panel">
          <h3>Renderer Controls</h3>
          
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              Show Grid
            </label>
          </div>
          
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={showAxes}
                onChange={(e) => setShowAxes(e.target.checked)}
              />
              Show Axes
            </label>
          </div>
          
          <div className="control-group">
            <button onClick={handleResetCamera}>
              Reset Camera
            </button>
          </div>
          
          <div className="control-info">
            <p>FPS: {fps}</p>
            <p>Status: {isInitialized ? '✅ Initialized' : '⏳ Loading...'}</p>
          </div>
        </div>
        
        <div className="control-instructions">
          <h4>Controls:</h4>
          <ul>
            <li>🖱️ Left click + drag: Rotate camera</li>
            <li>🖱️ Right click + drag: Pan camera</li>
            <li>🖱️ Scroll: Zoom in/out</li>
          </ul>
        </div>
      </div>
    </div>
  )
}