import * as THREE from 'three'

export enum CameraView {
  CHASE = 'chase',
  COCKPIT = 'cockpit',
  EXTERNAL = 'external',
  FLY_BY = 'flyby',
  TOWER = 'tower',
  ORBIT = 'orbit'
}

export interface CameraConfig {
  view: CameraView
  offset: THREE.Vector3
  lookAtOffset: THREE.Vector3
  fov: number
  fixed: boolean
}

export class CameraManager {
  private camera: THREE.PerspectiveCamera
  private currentView: CameraView = CameraView.CHASE
  private targetPosition: THREE.Vector3 = new THREE.Vector3()
  private targetLookAt: THREE.Vector3 = new THREE.Vector3()
  private smoothing: number = 0.1
  
  // Fixed positions for some views
  private towerPosition: THREE.Vector3 = new THREE.Vector3(100, 50, 100)
  private flyByPosition: THREE.Vector3 = new THREE.Vector3(0, 100, 500)
  
  private configs: Map<CameraView, CameraConfig> = new Map([
    [CameraView.CHASE, {
      view: CameraView.CHASE,
      offset: new THREE.Vector3(0, 10, -30),
      lookAtOffset: new THREE.Vector3(0, 0, 10),
      fov: 60,
      fixed: false
    }],
    [CameraView.COCKPIT, {
      view: CameraView.COCKPIT,
      offset: new THREE.Vector3(0, 2, 5),
      lookAtOffset: new THREE.Vector3(0, 1, 20),
      fov: 90,
      fixed: false
    }],
    [CameraView.EXTERNAL, {
      view: CameraView.EXTERNAL,
      offset: new THREE.Vector3(30, 10, 0),
      lookAtOffset: new THREE.Vector3(0, 0, 0),
      fov: 50,
      fixed: false
    }],
    [CameraView.FLY_BY, {
      view: CameraView.FLY_BY,
      offset: new THREE.Vector3(0, 0, 0),
      lookAtOffset: new THREE.Vector3(0, 0, 0),
      fov: 45,
      fixed: true
    }],
    [CameraView.TOWER, {
      view: CameraView.TOWER,
      offset: new THREE.Vector3(0, 0, 0),
      lookAtOffset: new THREE.Vector3(0, 0, 0),
      fov: 40,
      fixed: true
    }],
    [CameraView.ORBIT, {
      view: CameraView.ORBIT,
      offset: new THREE.Vector3(50, 20, 50),
      lookAtOffset: new THREE.Vector3(0, 0, 0),
      fov: 55,
      fixed: false
    }]
  ])
  
  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera
  }
  
  public setView(view: CameraView): void {
    this.currentView = view
    const config = this.configs.get(view)
    if (config) {
      this.camera.fov = config.fov
      this.camera.updateProjectionMatrix()
    }
  }
  
  public getCurrentView(): CameraView {
    return this.currentView
  }
  
  public nextView(): void {
    const views = Array.from(this.configs.keys())
    const currentIndex = views.indexOf(this.currentView)
    const nextIndex = (currentIndex + 1) % views.length
    this.setView(views[nextIndex])
  }
  
  public previousView(): void {
    const views = Array.from(this.configs.keys())
    const currentIndex = views.indexOf(this.currentView)
    const prevIndex = (currentIndex - 1 + views.length) % views.length
    this.setView(views[prevIndex])
  }
  
  public update(
    aircraftPosition: THREE.Vector3,
    aircraftRotation: THREE.Euler,
    deltaTime: number
  ): void {
    const config = this.configs.get(this.currentView)
    if (!config) return
    
    if (config.fixed) {
      // Fixed camera positions
      switch (this.currentView) {
        case CameraView.TOWER:
          this.targetPosition.copy(this.towerPosition)
          this.targetLookAt.copy(aircraftPosition)
          break
        case CameraView.FLY_BY:
          this.targetPosition.copy(this.flyByPosition)
          this.targetLookAt.copy(aircraftPosition)
          break
      }
    } else {
      // Dynamic camera positions relative to aircraft
      const offset = config.offset.clone()
      const lookAtOffset = config.lookAtOffset.clone()
      
      if (this.currentView === CameraView.ORBIT) {
        // Orbit camera rotates around aircraft
        const time = Date.now() * 0.001
        const radius = Math.sqrt(offset.x * offset.x + offset.z * offset.z)
        offset.x = Math.cos(time * 0.5) * radius
        offset.z = Math.sin(time * 0.5) * radius
      } else if (this.currentView !== CameraView.EXTERNAL) {
        // Apply aircraft rotation to offset (except for external view)
        offset.applyEuler(aircraftRotation)
        lookAtOffset.applyEuler(aircraftRotation)
      }
      
      this.targetPosition.copy(aircraftPosition).add(offset)
      this.targetLookAt.copy(aircraftPosition).add(lookAtOffset)
    }
    
    // Smooth camera movement
    const smoothingFactor = 1 - Math.exp(-this.smoothing * deltaTime * 60)
    this.camera.position.lerp(this.targetPosition, smoothingFactor)
    
    // Update camera look at
    const currentLookAt = new THREE.Vector3()
    this.camera.getWorldDirection(currentLookAt)
    currentLookAt.multiplyScalar(10).add(this.camera.position)
    currentLookAt.lerp(this.targetLookAt, smoothingFactor)
    this.camera.lookAt(currentLookAt)
  }
  
  public setTowerPosition(position: THREE.Vector3): void {
    this.towerPosition.copy(position)
  }
  
  public setFlyByPosition(position: THREE.Vector3): void {
    this.flyByPosition.copy(position)
  }
  
  public setSmoothingFactor(factor: number): void {
    this.smoothing = Math.max(0.01, Math.min(1, factor))
  }
}