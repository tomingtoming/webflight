import React, { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { AircraftManager } from '@/managers/AircraftManager'

interface ScreenshotResult {
  id: string
  dataUrl: string
  timestamp: number
}

export const ModelScreenshotGenerator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [screenshots, setScreenshots] = useState<ScreenshotResult[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const aircraftManager = useRef(new AircraftManager()).current
  
  const targetAircraft = [
    'f16', 'cessna172', 'a10', 'f18', 'p51',
    'b747', 'f22', 'mig29', 'spitfire', 'ah64'
  ]

  const generateScreenshots = async () => {
    if (!canvasRef.current) return
    
    setIsGenerating(true)
    setProgress(0)
    const results: ScreenshotResult[] = []
    
    // Load standard aircraft
    await aircraftManager.loadStandardAircraft()
    
    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true,
      preserveDrawingBuffer: true
    })
    renderer.setSize(800, 600)
    renderer.shadowMap.enabled = true
    
    // Setup scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)
    scene.fog = new THREE.Fog(0xf0f0f0, 100, 1000)
    
    // Setup camera
    const camera = new THREE.PerspectiveCamera(50, 800/600, 0.1, 1000)
    
    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 50, 50)
    directionalLight.castShadow = true
    scene.add(directionalLight)
    
    // Add ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200)
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc,
      roughness: 0.8
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    
    // Generate screenshots for each aircraft
    for (let i = 0; i < targetAircraft.length; i++) {
      const aircraftId = targetAircraft[i]
      setProgress((i + 1) / targetAircraft.length * 100)
      
      try {
        const asset = aircraftManager.getAircraft(aircraftId)
        if (!asset) continue
        
        // Create aircraft mesh
        const aircraftGroup = aircraftManager.createAircraftMesh(asset, false, {
          showCockpit: false,
          showCollision: false,
          wireframe: false
        })
        
        scene.add(aircraftGroup)
        
        // Position camera
        const box = new THREE.Box3().setFromObject(aircraftGroup)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        
        const distance = maxDim * 2.5
        camera.position.set(
          center.x + distance * 0.7,
          center.y + distance * 0.5,
          center.z + distance * 0.7
        )
        controls.target.copy(center)
        controls.update()
        
        // Render frame
        renderer.render(scene, camera)
        
        // Capture screenshot
        const dataUrl = renderer.domElement.toDataURL('image/png')
        results.push({
          id: aircraftId,
          dataUrl,
          timestamp: Date.now()
        })
        
        // Remove aircraft
        scene.remove(aircraftGroup)
        
        // Small delay to ensure proper rendering
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`Failed to generate screenshot for ${aircraftId}:`, error)
      }
    }
    
    renderer.dispose()
    setScreenshots(results)
    setIsGenerating(false)
  }

  const downloadScreenshots = () => {
    screenshots.forEach(screenshot => {
      const link = document.createElement('a')
      link.download = `webflight-${screenshot.id}.png`
      link.href = screenshot.dataUrl
      link.click()
    })
  }

  const downloadMarkdown = () => {
    let markdown = '# WebFlight Aircraft Model Screenshots\n\n'
    markdown += `Generated on ${new Date().toISOString()}\n\n`
    
    screenshots.forEach(screenshot => {
      markdown += `## ${screenshot.id.toUpperCase()}\n\n`
      markdown += `![${screenshot.id}](screenshots/${screenshot.id}.png)\n\n`
    })
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'aircraft-screenshots.md'
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Model Screenshot Generator</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={generateScreenshots}
          disabled={isGenerating}
          style={{
            padding: '10px 20px',
            backgroundColor: isGenerating ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isGenerating ? 'default' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isGenerating ? `Generating... ${Math.round(progress)}%` : 'Generate Screenshots'}
        </button>
        
        {screenshots.length > 0 && (
          <>
            <button 
              onClick={downloadScreenshots}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Download All Images
            </button>
            <button 
              onClick={downloadMarkdown}
              style={{
                padding: '10px 20px',
                backgroundColor: '#9C27B0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Download Markdown
            </button>
          </>
        )}
      </div>
      
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: isGenerating ? 'block' : 'none',
          border: '1px solid #ccc'
        }}
      />
      
      {screenshots.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {screenshots.map(screenshot => (
            <div key={screenshot.id} style={{ textAlign: 'center' }}>
              <img 
                src={screenshot.dataUrl} 
                alt={screenshot.id}
                style={{ 
                  width: '100%', 
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <p style={{ marginTop: '5px', fontWeight: 'bold' }}>
                {screenshot.id.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}