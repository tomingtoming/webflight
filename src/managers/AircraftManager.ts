import * as THREE from 'three'
import { AircraftData, AircraftDataParser } from '@/loaders/AircraftDataParser'
import { DNMModelParser } from '@/loaders/DNMModelParser'
import { AircraftListParser, AircraftListEntry } from '@/loaders/AircraftListParser'

export interface AircraftAsset {
  id: string
  data: AircraftData
  geometry: THREE.BufferGeometry
  material: THREE.Material
  collisionGeometry?: THREE.BufferGeometry
  cockpitGeometry?: THREE.BufferGeometry
  lodGeometry?: THREE.BufferGeometry
}

export interface AircraftDefinition {
  dataFile: string
  modelFile: string
  collisionFile?: string
  cockpitFile?: string
  lodFile?: string
}

export class AircraftManager {
  private cache: Map<string, AircraftAsset> = new Map()
  private loading: Map<string, Promise<AircraftAsset>> = new Map()
  private basePath: string = '/aircraft/'
  
  constructor(basePath?: string) {
    if (basePath) {
      this.basePath = basePath
    }
  }
  
  async loadAircraft(id: string, definition: AircraftDefinition): Promise<AircraftAsset> {
    // Check cache
    if (this.cache.has(id)) {
      return this.cache.get(id)!
    }
    
    // Check if already loading
    if (this.loading.has(id)) {
      return this.loading.get(id)!
    }
    
    // Start loading
    const loadPromise = this.loadAircraftAssets(id, definition)
    this.loading.set(id, loadPromise)
    
    try {
      const asset = await loadPromise
      this.cache.set(id, asset)
      this.loading.delete(id)
      return asset
    } catch (error) {
      this.loading.delete(id)
      throw error
    }
  }
  
  private async loadAircraftAssets(
    id: string, 
    definition: AircraftDefinition
  ): Promise<AircraftAsset> {
    // Load all files in parallel
    const [dataContent, modelContent] = await Promise.all([
      this.loadFile(definition.dataFile),
      this.loadFile(definition.modelFile)
    ])
    
    // Parse aircraft data
    const data = AircraftDataParser.parse(dataContent)
    
    // Parse model (now async to support SRF loading)
    const modelPath = `/aircraft/${definition.modelFile}`
    const model = await DNMModelParser.parse(modelContent, modelPath)
    const geometry = DNMModelParser.toThreeJS(model)
    
    console.log(`Loaded aircraft ${id}:`, {
      dataFile: definition.dataFile,
      modelFile: definition.modelFile,
      vertices: model.vertices.length,
      polygons: model.polygons.length
    })
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.7,
      roughness: 0.3,
      side: THREE.DoubleSide
    })
    
    const asset: AircraftAsset = {
      id,
      data,
      geometry,
      material
    }
    
    // Load optional files if provided
    if (definition.collisionFile) {
      try {
        const collisionContent = await this.loadFile(definition.collisionFile)
        const collisionPath = `/aircraft/${definition.collisionFile}`
        const collisionModel = await DNMModelParser.parse(collisionContent, collisionPath)
        asset.collisionGeometry = DNMModelParser.toThreeJS(collisionModel)
      } catch (error) {
        console.warn(`Failed to load collision model for ${id}:`, error)
      }
    }
    
    if (definition.cockpitFile) {
      try {
        const cockpitContent = await this.loadFile(definition.cockpitFile)
        const cockpitPath = `/aircraft/${definition.cockpitFile}`
        const cockpitModel = await DNMModelParser.parse(cockpitContent, cockpitPath)
        asset.cockpitGeometry = DNMModelParser.toThreeJS(cockpitModel)
      } catch (error) {
        console.warn(`Failed to load cockpit model for ${id}:`, error)
      }
    }
    
    if (definition.lodFile) {
      try {
        const lodContent = await this.loadFile(definition.lodFile)
        const lodPath = `/aircraft/${definition.lodFile}`
        const lodModel = await DNMModelParser.parse(lodContent, lodPath)
        asset.lodGeometry = DNMModelParser.toThreeJS(lodModel)
      } catch (error) {
        console.warn(`Failed to load LOD model for ${id}:`, error)
      }
    }
    
    return asset
  }
  
  private async loadFile(filename: string): Promise<string> {
    const url = this.basePath + filename
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.statusText}`)
    }
    
    return response.text()
  }
  
  getAircraft(id: string): AircraftAsset | undefined {
    return this.cache.get(id)
  }
  
  getAllAircraft(): AircraftAsset[] {
    return Array.from(this.cache.values())
  }
  
  clearCache(): void {
    // Dispose of geometries and materials
    for (const asset of this.cache.values()) {
      asset.geometry.dispose()
      asset.material.dispose()
      asset.collisionGeometry?.dispose()
      asset.cockpitGeometry?.dispose()
      asset.lodGeometry?.dispose()
    }
    
    this.cache.clear()
    this.loading.clear()
  }
  
  // Create a Three.js mesh from an aircraft asset
  createAircraftMesh(asset: AircraftAsset, useLOD: boolean = false): THREE.Mesh {
    const geometry = useLOD && asset.lodGeometry ? asset.lodGeometry : asset.geometry
    
    // Check if geometry has vertices
    if (!geometry.attributes.position || geometry.attributes.position.count === 0) {
      console.warn(`No vertices in geometry for ${asset.id}, using fallback`)
      return this.createFallbackMesh()
    }
    
    // Clone the geometry to avoid modifying the cached version
    const meshGeometry = geometry.clone()
    
    // Create mesh with the material
    const mesh = new THREE.Mesh(meshGeometry, asset.material.clone())
    mesh.castShadow = true
    mesh.receiveShadow = true
    
    // YSFlight coordinate system conversion:
    // YSFlight: X=right, Y=up, Z=forward
    // Three.js: X=right, Y=up, Z=backward
    // So we need to negate Z coordinates
    const positions = meshGeometry.attributes.position.array
    for (let i = 2; i < positions.length; i += 3) {
      positions[i] = -positions[i] // Negate Z
    }
    meshGeometry.attributes.position.needsUpdate = true
    
    // Recompute normals after coordinate transformation
    meshGeometry.computeVertexNormals()
    meshGeometry.computeBoundingBox()
    meshGeometry.computeBoundingSphere()
    
    // Scale the mesh based on bounding box
    const box = meshGeometry.boundingBox!
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDimension = Math.max(size.x, size.y, size.z)
    
    // Different aircraft types need different scales
    let targetSize = 15 // Default size
    if (asset.id.includes('cessna') || asset.id.includes('archer')) {
      targetSize = 10 // Smaller for general aviation
    } else if (asset.id.includes('b747') || asset.id.includes('b777')) {
      targetSize = 30 // Larger for airliners
    }
    
    if (maxDimension > 0) {
      const scale = targetSize / maxDimension
      mesh.scale.setScalar(scale)
    }
    
    return mesh
  }
  
  private createFallbackMesh(): THREE.Mesh {
    // Create simple aircraft geometry as fallback
    const geometry = new THREE.ConeGeometry(2, 10, 8)
    geometry.rotateX(Math.PI / 2)
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x0000ff,
      metalness: 0.7,
      roughness: 0.3
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    
    // Add wings
    const wingGeometry = new THREE.BoxGeometry(20, 0.5, 5)
    const wings = new THREE.Mesh(wingGeometry, material)
    wings.position.z = -2
    wings.castShadow = true
    mesh.add(wings)
    
    // Add tail
    const tailGeometry = new THREE.BoxGeometry(0.5, 5, 3)
    const tail = new THREE.Mesh(tailGeometry, material)
    tail.position.set(0, 2, -4)
    tail.castShadow = true
    mesh.add(tail)
    
    return mesh
  }
  
  // Load aircraft list from aircraft.lst file
  async loadAircraftList(): Promise<AircraftListEntry[]> {
    const url = this.basePath + 'aircraft.lst'
    return AircraftListParser.loadFromUrl(url)
  }
  
  // Load standard aircraft definitions
  async loadStandardAircraft(): Promise<void> {
    const standardAircraft: Array<{ id: string; definition: AircraftDefinition }> = [
      {
        id: 'f16',
        definition: {
          dataFile: 'f16.dat',
          modelFile: 'f16.dnm',
          collisionFile: 'f16coll.srf',
          cockpitFile: 'f16cockpit.srf',
          lodFile: 'f16_coarse.dnm'
        }
      },
      {
        id: 'cessna172',
        definition: {
          dataFile: 'cessna172r.dat',
          modelFile: 'cessna172r.dnm',
          collisionFile: 'cessna172_collision.srf',
          cockpitFile: 'cessna172_cockpit.srf'
        }
      },
      {
        id: 'b747',
        definition: {
          dataFile: 'b747.dat',
          modelFile: 'b747.dnm',
          collisionFile: 'b747coll.srf',
          cockpitFile: 'b747cockpit.srf',
          lodFile: 'b747coarse.dnm'
        }
      }
    ]
    
    // Load all aircraft in parallel
    await Promise.all(
      standardAircraft.map(({ id, definition }) => 
        this.loadAircraft(id, definition).catch(error => {
          console.error(`Failed to load aircraft ${id}:`, error)
        })
      )
    )
  }
  
  // Load all aircraft from aircraft.lst
  async loadAllAircraft(): Promise<void> {
    try {
      const aircraftList = await this.loadAircraftList()
      console.log(`Found ${aircraftList.length} aircraft in aircraft.lst`)
      
      // Load aircraft in batches to avoid overwhelming the browser
      const batchSize = 5
      for (let i = 0; i < aircraftList.length; i += batchSize) {
        const batch = aircraftList.slice(i, i + batchSize)
        await Promise.all(
          batch.map(entry => 
            this.loadAircraft(entry.id, entry.definition).catch(error => {
              console.error(`Failed to load aircraft ${entry.id}:`, error)
            })
          )
        )
      }
    } catch (error) {
      console.error('Failed to load aircraft list:', error)
    }
  }
}