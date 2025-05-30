import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { AircraftManager } from '@/managers/AircraftManager'

interface SRFTestViewerProps {
  className?: string
}

export const SRFTestViewer: React.FC<SRFTestViewerProps> = ({ className }) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const aircraftManagerRef = useRef<AircraftManager>()
  const [loading, setLoading] = useState(false)
  const [loadedAircraft, setLoadedAircraft] = useState<string[]>([])
  const [selectedAircraft, setSelectedAircraft] = useState<string>('f16')
  const [showCockpit, setShowCockpit] = useState(true)
  const [showCollision, setShowCollision] = useState(false)
  const [wireframe, setWireframe] = useState(false)
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return
    
    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB) // Sky blue
    sceneRef.current = scene
    
    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(20, 10, 20)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(800, 600)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer
    
    mountRef.current.appendChild(renderer.domElement)
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 50, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)
    
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100)
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    
    // Grid helper
    const gridHelper = new THREE.GridHelper(100, 50)
    scene.add(gridHelper)
    
    // Controls (simple mouse orbit)
    let isMouseDown = false
    let mouseX = 0
    let mouseY = 0
    
    const handleMouseDown = (event: MouseEvent) => {
      isMouseDown = true
      mouseX = event.clientX
      mouseY = event.clientY
    }
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return
      
      const deltaX = event.clientX - mouseX
      const deltaY = event.clientY - mouseY
      
      // Orbit around the origin
      const spherical = new THREE.Spherical()
      spherical.setFromVector3(camera.position)
      spherical.theta -= deltaX * 0.01
      spherical.phi += deltaY * 0.01
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))
      
      camera.position.setFromSpherical(spherical)
      camera.lookAt(0, 0, 0)
      
      mouseX = event.clientX
      mouseY = event.clientY
    }
    
    const handleMouseUp = () => {
      isMouseDown = false
    }
    
    const handleWheel = (event: WheelEvent) => {
      const factor = event.deltaY > 0 ? 1.1 : 0.9
      camera.position.multiplyScalar(factor)
    }
    
    renderer.domElement.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    renderer.domElement.addEventListener('wheel', handleWheel)
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()
    
    // Initialize aircraft manager
    aircraftManagerRef.current = new AircraftManager()
    
    return () => {
      renderer.domElement.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      renderer.domElement.removeEventListener('wheel', handleWheel)
      mountRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])
  
  // Load aircraft
  const loadAircraft = async () => {
    if (!aircraftManagerRef.current || !sceneRef.current) return
    
    setLoading(true)
    try {
      console.log('Loading standard aircraft...')
      await aircraftManagerRef.current.loadStandardAircraft()
      
      const allAircraft = aircraftManagerRef.current.getAllAircraft()
      setLoadedAircraft(allAircraft.map(a => a.id))
      
      console.log('Loaded aircraft:', allAircraft.map(a => a.id))
      
      // Display the first loaded aircraft
      if (allAircraft.length > 0) {
        displayAircraft(allAircraft[0].id)
      }
    } catch (error) {
      console.error('Failed to load aircraft:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Display specific aircraft
  const displayAircraft = (aircraftId: string) => {
    if (!aircraftManagerRef.current || !sceneRef.current) return
    
    const asset = aircraftManagerRef.current.getAircraft(aircraftId)
    if (!asset) {
      console.error(`Aircraft ${aircraftId} not found`)
      return
    }
    
    // Remove existing aircraft
    const existingAircraft = sceneRef.current.getObjectByName(`aircraft-${aircraftId}`)
    if (existingAircraft) {
      sceneRef.current.remove(existingAircraft)
    }
    
    // Clear all aircraft meshes
    const aircraftMeshes = sceneRef.current.children.filter(child => 
      child.name.startsWith('aircraft-')
    )
    aircraftMeshes.forEach(mesh => sceneRef.current!.remove(mesh))
    
    try {
      // Create and add new aircraft mesh
      const aircraftMesh = aircraftManagerRef.current.createAircraftMesh(asset, false, {
        showCockpit,
        showCollision,
        wireframe
      })
      
      sceneRef.current.add(aircraftMesh)
      setSelectedAircraft(aircraftId)
      
      console.log(`Displayed aircraft: ${aircraftId}`)
      console.log('Aircraft mesh children:', aircraftMesh.children.map(c => c.name))
    } catch (error) {
      console.error(`Failed to display aircraft ${aircraftId}:`, error)
    }
  }
  
  // Update display options
  useEffect(() => {
    if (selectedAircraft) {
      displayAircraft(selectedAircraft)
    }
  }, [showCockpit, showCollision, wireframe])
  
  return (
    <div className={className}>
      <div style={{ marginBottom: '20px' }}>
        <h3>SRF Model Parser Test</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <button onClick={loadAircraft} disabled={loading}>
            {loading ? 'Loading...' : 'Load Aircraft'}
          </button>
        </div>
        
        {loadedAircraft.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <label>
              Aircraft:
              <select 
                value={selectedAircraft} 
                onChange={(e) => displayAircraft(e.target.value)}
                style={{ marginLeft: '10px' }}
              >
                {loadedAircraft.map(id => (
                  <option key={id} value={id}>{id.toUpperCase()}</option>
                ))}
              </select>
            </label>
          </div>
        )}
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            <input
              type="checkbox"
              checked={showCockpit}
              onChange={(e) => setShowCockpit(e.target.checked)}
            />
            Show Cockpit
          </label>
          <label style={{ marginLeft: '20px' }}>
            <input
              type="checkbox"
              checked={showCollision}
              onChange={(e) => setShowCollision(e.target.checked)}
            />
            Show Collision
          </label>
          <label style={{ marginLeft: '20px' }}>
            <input
              type="checkbox"
              checked={wireframe}
              onChange={(e) => setWireframe(e.target.checked)}
            />
            Wireframe
          </label>
        </div>
        
        <div style={{ fontSize: '12px', color: '#666' }}>
          Mouse: Drag to orbit, Wheel to zoom<br/>
          Loaded: {loadedAircraft.length} aircraft
        </div>
      </div>
      
      <div ref={mountRef} style={{ border: '1px solid #ccc' }} />
    </div>
  )
}