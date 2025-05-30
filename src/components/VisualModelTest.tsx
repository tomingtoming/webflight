import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { AircraftManager, AircraftAsset } from '@/managers/AircraftManager'

interface ModelTestResult {
  id: string
  success: boolean
  vertices?: number
  triangles?: number
  loadTime?: number
  error?: string
  hasCollision?: boolean
  hasCockpit?: boolean
  hasLOD?: boolean
}

export const VisualModelTest: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const aircraftGroupRef = useRef<THREE.Group | null>(null)
  
  const [testResults, setTestResults] = useState<ModelTestResult[]>([])
  const [selectedAircraft, setSelectedAircraft] = useState<string>('f16')
  const [isLoading, setIsLoading] = useState(false)
  const [showCockpit, setShowCockpit] = useState(false)
  const [showCollision, setShowCollision] = useState(false)
  const [wireframe, setWireframe] = useState(false)
  
  const aircraftManager = useRef(new AircraftManager()).current

  // Test aircraft configurations
  const testAircraft = [
    { id: 'f16', name: 'F-16 Fighting Falcon' },
    { id: 'cessna172', name: 'Cessna 172' },
    { id: 'a10', name: 'A-10 Thunderbolt II' },
    { id: 'f18', name: 'F/A-18 Hornet' },
    { id: 'p51', name: 'P-51 Mustang' },
    { id: 'b747', name: 'Boeing 747' },
    { id: 'f22', name: 'F-22 Raptor' },
    { id: 'mig29', name: 'MiG-29' },
    { id: 'spitfire', name: 'Supermarine Spitfire' },
    { id: 'ah64', name: 'AH-64 Apache' },
  ]

  useEffect(() => {
    if (!mountRef.current) return

    // Setup scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)
    scene.fog = new THREE.Fog(0xf0f0f0, 100, 1000)
    sceneRef.current = scene

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(30, 20, 30)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controlsRef.current = controls

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 50, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.camera.near = 0.1
    directionalLight.shadow.camera.far = 200
    directionalLight.shadow.camera.left = -50
    directionalLight.shadow.camera.right = 50
    directionalLight.shadow.camera.top = 50
    directionalLight.shadow.camera.bottom = -50
    scene.add(directionalLight)

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200)
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc,
      roughness: 0.8
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.1
    ground.receiveShadow = true
    scene.add(ground)

    // Add grid
    const gridHelper = new THREE.GridHelper(200, 20, 0x888888, 0xdddddd)
    scene.add(gridHelper)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // Run initial tests
    runAllTests()

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      mountRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  const runAllTests = async () => {
    const results: ModelTestResult[] = []
    
    // Load standard aircraft first
    await aircraftManager.loadStandardAircraft()
    
    for (const aircraft of testAircraft) {
      const start = performance.now()
      try {
        const asset = aircraftManager.getAircraft(aircraft.id)
        if (asset) {
          const loadTime = performance.now() - start
          const vertexCount = asset.geometry.attributes.position?.count || 0
          const triangleCount = vertexCount / 3
          
          results.push({
            id: aircraft.id,
            success: true,
            vertices: vertexCount,
            triangles: Math.floor(triangleCount),
            loadTime: Math.round(loadTime),
            hasCollision: !!asset.collisionGeometry,
            hasCockpit: !!asset.cockpitGeometry,
            hasLOD: !!asset.lodGeometry
          })
        } else {
          results.push({
            id: aircraft.id,
            success: false,
            error: 'Not found in standard aircraft'
          })
        }
      } catch (error) {
        results.push({
          id: aircraft.id,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
    
    setTestResults(results)
  }

  const displayAircraft = async (id: string) => {
    if (!sceneRef.current) return
    
    setIsLoading(true)
    
    // Remove previous aircraft
    if (aircraftGroupRef.current) {
      sceneRef.current.remove(aircraftGroupRef.current)
      aircraftGroupRef.current = null
    }
    
    try {
      const asset = aircraftManager.getAircraft(id)
      if (asset) {
        const aircraftGroup = aircraftManager.createAircraftMesh(asset, false, {
          showCockpit,
          showCollision,
          wireframe
        })
        
        sceneRef.current.add(aircraftGroup)
        aircraftGroupRef.current = aircraftGroup
        
        // Center camera on aircraft
        const box = new THREE.Box3().setFromObject(aircraftGroup)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        
        if (cameraRef.current && controlsRef.current) {
          const distance = maxDim * 2.5
          cameraRef.current.position.set(
            center.x + distance,
            center.y + distance * 0.5,
            center.z + distance
          )
          controlsRef.current.target.copy(center)
          controlsRef.current.update()
        }
      }
    } catch (error) {
      console.error('Failed to display aircraft:', error)
    }
    
    setIsLoading(false)
  }

  useEffect(() => {
    displayAircraft(selectedAircraft)
  }, [selectedAircraft, showCockpit, showCollision, wireframe])

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 3D View */}
      <div ref={mountRef} style={{ flex: 1 }} />
      
      {/* Control Panel */}
      <div style={{ 
        width: '400px', 
        padding: '20px', 
        backgroundColor: '#f5f5f5',
        overflowY: 'auto'
      }}>
        <h2>Visual Model Test</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>Display Options</h3>
          <label style={{ display: 'block', marginBottom: '10px' }}>
            <input
              type="checkbox"
              checked={showCockpit}
              onChange={(e) => setShowCockpit(e.target.checked)}
            />
            Show Cockpit
          </label>
          <label style={{ display: 'block', marginBottom: '10px' }}>
            <input
              type="checkbox"
              checked={showCollision}
              onChange={(e) => setShowCollision(e.target.checked)}
            />
            Show Collision Mesh
          </label>
          <label style={{ display: 'block', marginBottom: '10px' }}>
            <input
              type="checkbox"
              checked={wireframe}
              onChange={(e) => setWireframe(e.target.checked)}
            />
            Wireframe Mode
          </label>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>Select Aircraft</h3>
          <select 
            value={selectedAircraft}
            onChange={(e) => setSelectedAircraft(e.target.value)}
            style={{ width: '100%', padding: '5px' }}
            disabled={isLoading}
          >
            {testAircraft.map(aircraft => (
              <option key={aircraft.id} value={aircraft.id}>
                {aircraft.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <h3>Test Results</h3>
          <div style={{ fontSize: '14px' }}>
            {testResults.map(result => (
              <div 
                key={result.id}
                style={{ 
                  marginBottom: '10px',
                  padding: '10px',
                  backgroundColor: result.success ? '#e8f5e9' : '#ffebee',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => result.success && setSelectedAircraft(result.id)}
              >
                <strong>{result.id}</strong>
                {result.success ? (
                  <>
                    <div>✅ Loaded successfully</div>
                    <div>Vertices: {result.vertices}</div>
                    <div>Triangles: {result.triangles}</div>
                    <div>Load time: {result.loadTime}ms</div>
                    <div>
                      Features: 
                      {result.hasCollision && ' 🛡️ Collision'}
                      {result.hasCockpit && ' 🪟 Cockpit'}
                      {result.hasLOD && ' 📐 LOD'}
                    </div>
                  </>
                ) : (
                  <div>❌ {result.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}