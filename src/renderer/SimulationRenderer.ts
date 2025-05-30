import * as THREE from 'three'
import { WebGLRenderer } from './WebGLRenderer'
import type { YSFlightCore } from '@/types/wasm'

export interface Aircraft {
  id: string
  position: THREE.Vector3
  rotation: THREE.Euler
  velocity: THREE.Vector3
  mesh?: THREE.Mesh
}

export class SimulationRenderer extends WebGLRenderer {
  // private wasm: YSFlightCore | null = null // Will be used later
  private aircraft: Map<string, Aircraft> = new Map()
  private terrain?: THREE.Mesh
  
  constructor(canvas: HTMLCanvasElement) {
    super(canvas, {
      antialias: true,
      shadows: true,
      maxFPS: 60
    })
  }
  
  public setWasmModule(_wasm: YSFlightCore): void {
    // this.wasm = wasm // Will be used later
  }
  
  public addAircraft(id: string, position: THREE.Vector3): Aircraft {
    // Create simple aircraft geometry for now
    const geometry = new THREE.ConeGeometry(2, 10, 8)
    geometry.rotateX(Math.PI / 2)
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x0000ff,
      metalness: 0.7,
      roughness: 0.3
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)
    mesh.castShadow = true
    mesh.receiveShadow = true
    
    // Add wings
    const wingGeometry = new THREE.BoxGeometry(20, 0.5, 5)
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x0000ff,
      metalness: 0.7,
      roughness: 0.3
    })
    const wings = new THREE.Mesh(wingGeometry, wingMaterial)
    wings.position.z = -2
    wings.castShadow = true
    mesh.add(wings)
    
    // Add tail
    const tailGeometry = new THREE.BoxGeometry(0.5, 5, 3)
    const tailMaterial = new THREE.MeshStandardMaterial({
      color: 0x0000ff,
      metalness: 0.7,
      roughness: 0.3
    })
    const tail = new THREE.Mesh(tailGeometry, tailMaterial)
    tail.position.set(0, 2, -4)
    tail.castShadow = true
    mesh.add(tail)
    
    this.getScene().add(mesh)
    
    const aircraft: Aircraft = {
      id,
      position: position.clone(),
      rotation: new THREE.Euler(),
      velocity: new THREE.Vector3(),
      mesh
    }
    
    this.aircraft.set(id, aircraft)
    return aircraft
  }
  
  public removeAircraft(id: string): void {
    const aircraft = this.aircraft.get(id)
    if (aircraft?.mesh) {
      this.getScene().remove(aircraft.mesh)
      aircraft.mesh.geometry.dispose()
      if (aircraft.mesh.material instanceof THREE.Material) {
        aircraft.mesh.material.dispose()
      }
    }
    this.aircraft.delete(id)
  }
  
  public updateAircraft(
    id: string, 
    position: THREE.Vector3, 
    rotation: THREE.Euler,
    velocity: THREE.Vector3
  ): void {
    const aircraft = this.aircraft.get(id)
    if (!aircraft) return
    
    aircraft.position.copy(position)
    aircraft.rotation.copy(rotation)
    aircraft.velocity.copy(velocity)
    
    if (aircraft.mesh) {
      aircraft.mesh.position.copy(position)
      aircraft.mesh.rotation.copy(rotation)
    }
  }
  
  public addTerrain(): void {
    // Create simple terrain mesh
    const geometry = new THREE.PlaneGeometry(10000, 10000, 100, 100)
    
    // Add some height variation
    const vertices = geometry.attributes.position.array
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i]
      const y = vertices[i + 1]
      const height = Math.sin(x * 0.01) * 10 + Math.cos(y * 0.01) * 5
      vertices[i + 2] = height
    }
    
    geometry.computeVertexNormals()
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x3a5f3a,
      roughness: 0.9
    })
    
    this.terrain = new THREE.Mesh(geometry, material)
    this.terrain.rotation.x = -Math.PI / 2
    this.terrain.receiveShadow = true
    
    this.getScene().add(this.terrain)
  }
  
  public followAircraft(id: string, distance: number = 50): void {
    const aircraft = this.aircraft.get(id)
    if (!aircraft) return
    
    // Calculate camera position behind and above the aircraft
    const offset = new THREE.Vector3(0, 10, -distance)
    offset.applyEuler(aircraft.rotation)
    
    const cameraPosition = aircraft.position.clone().add(offset)
    this.setCameraPosition(cameraPosition.x, cameraPosition.y, cameraPosition.z)
    this.setCameraTarget(
      aircraft.position.x,
      aircraft.position.y,
      aircraft.position.z
    )
  }
  
  public getAircraft(id: string): Aircraft | undefined {
    return this.aircraft.get(id)
  }
  
  public getAllAircraft(): Aircraft[] {
    return Array.from(this.aircraft.values())
  }
  
  // Override dispose to clean up aircraft
  public dispose(): void {
    // Remove all aircraft
    this.aircraft.forEach((_, id) => this.removeAircraft(id))
    
    // Remove terrain
    if (this.terrain) {
      this.getScene().remove(this.terrain)
      this.terrain.geometry.dispose()
      if (this.terrain.material instanceof THREE.Material) {
        this.terrain.material.dispose()
      }
    }
    
    // Call parent dispose
    super.dispose()
  }
}