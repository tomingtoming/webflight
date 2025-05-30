import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass'

export interface RendererConfig {
  antialias?: boolean
  shadows?: boolean
  maxFPS?: number
  pixelRatio?: number
}

export class WebGLRenderer {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private composer: EffectComposer
  // private clock: THREE.Clock // Unused for now
  private animationId: number | null = null
  
  // Scene objects
  private ambientLight: THREE.AmbientLight
  private directionalLight: THREE.DirectionalLight
  private gridHelper: THREE.GridHelper
  private axesHelper: THREE.AxesHelper
  
  // Performance
  private lastTime = 0
  private maxFPS: number
  
  constructor(
    private canvas: HTMLCanvasElement,
    config: RendererConfig = {}
  ) {
    const {
      antialias = true,
      shadows = true,
      maxFPS = 60,
      pixelRatio = window.devicePixelRatio
    } = config
    
    this.maxFPS = maxFPS
    // this.clock = new THREE.Clock() // Unused for now
    
    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias,
      alpha: true,
      powerPreference: 'high-performance'
    })
    
    this.renderer.setPixelRatio(Math.min(pixelRatio, 2))
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    this.renderer.shadowMap.enabled = shadows
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    
    // Initialize scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87CEEB) // Sky blue
    this.scene.fog = new THREE.Fog(0x87CEEB, 100, 10000)
    
    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      20000
    )
    this.camera.position.set(50, 30, 50)
    this.camera.lookAt(0, 0, 0)
    
    // Initialize controls
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 10
    this.controls.maxDistance = 5000
    this.controls.maxPolarAngle = Math.PI * 0.495
    
    // Initialize lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(this.ambientLight)
    
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    this.directionalLight.position.set(100, 100, 50)
    this.directionalLight.castShadow = shadows
    this.directionalLight.shadow.mapSize.width = 2048
    this.directionalLight.shadow.mapSize.height = 2048
    this.directionalLight.shadow.camera.near = 0.5
    this.directionalLight.shadow.camera.far = 500
    this.directionalLight.shadow.camera.left = -100
    this.directionalLight.shadow.camera.right = 100
    this.directionalLight.shadow.camera.top = 100
    this.directionalLight.shadow.camera.bottom = -100
    this.scene.add(this.directionalLight)
    
    // Initialize helpers
    this.gridHelper = new THREE.GridHelper(1000, 50, 0x444444, 0x888888)
    this.scene.add(this.gridHelper)
    
    this.axesHelper = new THREE.AxesHelper(100)
    this.scene.add(this.axesHelper)
    
    // Initialize post-processing
    this.composer = new EffectComposer(this.renderer)
    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)
    
    // Add SMAA anti-aliasing
    if (!antialias) {
      const smaaPass = new SMAAPass(
        canvas.clientWidth * pixelRatio,
        canvas.clientHeight * pixelRatio
      )
      this.composer.addPass(smaaPass)
    }
    
    // Add test geometry
    this.addTestGeometry()
    
    // Handle window resize
    this.handleResize = this.handleResize.bind(this)
    window.addEventListener('resize', this.handleResize)
  }
  
  private addTestGeometry(): void {
    // Add a test cube
    const geometry = new THREE.BoxGeometry(10, 10, 10)
    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.7,
      roughness: 0.3
    })
    const cube = new THREE.Mesh(geometry, material)
    cube.position.y = 5
    cube.castShadow = true
    cube.receiveShadow = true
    this.scene.add(cube)
    
    // Add ground plane
    const planeGeometry = new THREE.PlaneGeometry(1000, 1000)
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.8
    })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotation.x = -Math.PI / 2
    plane.receiveShadow = true
    this.scene.add(plane)
    
    // Animate the cube
    const animate = () => {
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
    }
    
    this.scene.userData.animate = animate
  }
  
  private handleResize(): void {
    const width = this.canvas.clientWidth
    const height = this.canvas.clientHeight
    
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    
    this.renderer.setSize(width, height)
    this.composer.setSize(width, height)
  }
  
  public start(): void {
    if (this.animationId !== null) return
    
    const animate = (currentTime: number) => {
      this.animationId = requestAnimationFrame(animate)
      
      // Frame rate limiting
      const deltaTime = currentTime - this.lastTime
      const frameInterval = 1000 / this.maxFPS
      
      if (deltaTime < frameInterval) return
      
      this.lastTime = currentTime - (deltaTime % frameInterval)
      
      // Update controls
      this.controls.update()
      
      // Update scene animations
      if (this.scene.userData.animate) {
        this.scene.userData.animate()
      }
      
      // Render
      this.composer.render()
    }
    
    animate(0)
  }
  
  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }
  
  public dispose(): void {
    this.stop()
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize)
    
    // Dispose Three.js objects
    this.controls.dispose()
    this.renderer.dispose()
    this.composer.dispose()
    
    // Dispose geometries and materials
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (object.material instanceof THREE.Material) {
          object.material.dispose()
        } else if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose())
        }
      }
    })
  }
  
  // Public API
  public getScene(): THREE.Scene {
    return this.scene
  }
  
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }
  
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }
  
  public setShowGrid(show: boolean): void {
    this.gridHelper.visible = show
  }
  
  public setShowAxes(show: boolean): void {
    this.axesHelper.visible = show
  }
  
  public setCameraPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z)
    this.controls.update()
  }
  
  public setCameraTarget(x: number, y: number, z: number): void {
    this.controls.target.set(x, y, z)
    this.controls.update()
  }
}