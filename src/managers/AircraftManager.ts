import * as THREE from 'three'
import { AircraftData, AircraftDataParser } from '@/loaders/AircraftDataParser'
import { DNMModelParser } from '@/loaders/DNMModelParser'
import { SRFModelParser } from '@/loaders/SRFModelParser'
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
    
    // Parse model (simplified parser, no longer needs model path)
    const model = DNMModelParser.parse(modelContent)
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
        if (definition.collisionFile.endsWith('.srf')) {
          // Use SRF parser for SRF files
          const collisionUrl = `/aircraft/${definition.collisionFile}`
          asset.collisionGeometry = await SRFModelParser.loadGeometryFromUrl(collisionUrl)
          console.log(`Loaded collision SRF for ${id}: ${definition.collisionFile}`)
        } else {
          // Use DNM parser for DNM files
          const collisionContent = await this.loadFile(definition.collisionFile)
          const collisionModel = DNMModelParser.parse(collisionContent)
          asset.collisionGeometry = DNMModelParser.toThreeJS(collisionModel)
        }
      } catch (error) {
        console.warn(`Failed to load collision model for ${id}:`, error)
      }
    }
    
    if (definition.cockpitFile) {
      try {
        if (definition.cockpitFile.endsWith('.srf')) {
          // Use SRF parser for SRF files
          const cockpitUrl = `/aircraft/${definition.cockpitFile}`
          asset.cockpitGeometry = await SRFModelParser.loadGeometryFromUrl(cockpitUrl)
          console.log(`Loaded cockpit SRF for ${id}: ${definition.cockpitFile}`)
        } else {
          // Use DNM parser for DNM files
          const cockpitContent = await this.loadFile(definition.cockpitFile)
          const cockpitModel = DNMModelParser.parse(cockpitContent)
          asset.cockpitGeometry = DNMModelParser.toThreeJS(cockpitModel)
        }
      } catch (error) {
        console.warn(`Failed to load cockpit model for ${id}:`, error)
      }
    }
    
    if (definition.lodFile) {
      try {
        if (definition.lodFile.endsWith('.srf')) {
          // Use SRF parser for SRF files
          const lodUrl = `/aircraft/${definition.lodFile}`
          asset.lodGeometry = await SRFModelParser.loadGeometryFromUrl(lodUrl)
          console.log(`Loaded LOD SRF for ${id}: ${definition.lodFile}`)
        } else {
          // Use DNM parser for DNM files
          const lodContent = await this.loadFile(definition.lodFile)
          const lodModel = DNMModelParser.parse(lodContent)
          asset.lodGeometry = DNMModelParser.toThreeJS(lodModel)
        }
      } catch (error) {
        console.warn(`Failed to load LOD model for ${id}:`, error)
      }
    }
    
    return asset
  }
  
  private async loadFile(filename: string): Promise<string> {
    const url = this.basePath + filename
    
    // Handle relative URLs in Node.js environment (similar to SRFModelParser)
    const isNodeEnvironment = typeof window === 'undefined' || typeof process !== 'undefined'
    
    if (isNodeEnvironment && url.startsWith('/')) {
      try {
        // In Node.js environment, read file directly
        const path = await import('path')
        const fs = await import('fs')
        const projectRoot = process.cwd()
        const filePath = path.join(projectRoot, 'public', url.slice(1))
        
        if (!fs.existsSync(filePath)) {
          throw new Error(`File not found: ${filePath}`)
        }
        
        return fs.readFileSync(filePath, 'utf-8')
      } catch (error) {
        // Fall back to fetch if file reading fails
        console.warn(`Direct file reading failed for ${filename}, falling back to fetch:`, error)
      }
    }
    
    // Browser environment or fallback - use fetch
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
  createAircraftMesh(asset: AircraftAsset, useLOD: boolean = false, options: {
    showCockpit?: boolean,
    showCollision?: boolean,
    wireframe?: boolean
  } = {}): THREE.Group {
    const aircraftGroup = new THREE.Group()
    aircraftGroup.name = `aircraft-${asset.id}`
    
    // Create main mesh
    const geometry = useLOD && asset.lodGeometry ? asset.lodGeometry : asset.geometry
    
    // Check if geometry has vertices
    if (!geometry.attributes.position || geometry.attributes.position.count === 0) {
      console.warn(`No vertices in geometry for ${asset.id}, using fallback`)
      const fallbackMesh = this.createFallbackMesh()
      aircraftGroup.add(fallbackMesh)
      return aircraftGroup
    }
    
    // Clone the geometry to avoid modifying the cached version
    const meshGeometry = geometry.clone()
    
    // Apply coordinate system transformation
    this.applyCoordinateTransform(meshGeometry)
    
    // Create main mesh
    const material = asset.material.clone() as THREE.MeshStandardMaterial
    if (options.wireframe) {
      material.wireframe = true
    }
    
    const mainMesh = new THREE.Mesh(meshGeometry, material)
    mainMesh.castShadow = true
    mainMesh.receiveShadow = true
    mainMesh.name = 'main-body'
    
    // Scale the entire group
    this.applyAircraftScale(aircraftGroup, meshGeometry, asset.id)
    
    aircraftGroup.add(mainMesh)
    
    // Add cockpit mesh if available and requested
    if (options.showCockpit && asset.cockpitGeometry) {
      const cockpitGeometry = asset.cockpitGeometry.clone()
      this.applyCoordinateTransform(cockpitGeometry)
      
      const cockpitMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        metalness: 0.3,
        roughness: 0.7,
        transparent: true,
        opacity: 0.9
      })
      
      const cockpitMesh = new THREE.Mesh(cockpitGeometry, cockpitMaterial)
      cockpitMesh.name = 'cockpit'
      aircraftGroup.add(cockpitMesh)
      
      console.log(`Added cockpit mesh for ${asset.id}`)
    }
    
    // Add collision mesh if available and requested
    if (options.showCollision && asset.collisionGeometry) {
      const collisionGeometry = asset.collisionGeometry.clone()
      this.applyCoordinateTransform(collisionGeometry)
      
      const collisionMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      })
      
      const collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial)
      collisionMesh.name = 'collision'
      aircraftGroup.add(collisionMesh)
      
      console.log(`Added collision mesh for ${asset.id}`)
    }
    
    return aircraftGroup
  }
  
  /**
   * Apply YSFlight to Three.js coordinate system transformation
   */
  private applyCoordinateTransform(geometry: THREE.BufferGeometry): void {
    // YSFlight: X=right, Y=up, Z=forward
    // Three.js: X=right, Y=up, Z=backward
    // So we need to negate Z coordinates
    const positions = geometry.attributes.position.array as Float32Array
    for (let i = 2; i < positions.length; i += 3) {
      positions[i] = -positions[i] // Negate Z
    }
    geometry.attributes.position.needsUpdate = true
    
    // Recompute normals after coordinate transformation
    geometry.computeVertexNormals()
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
  }
  
  /**
   * Apply appropriate scaling to aircraft based on type and size
   */
  private applyAircraftScale(group: THREE.Group, geometry: THREE.BufferGeometry, aircraftId: string): void {
    const box = geometry.boundingBox!
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDimension = Math.max(size.x, size.y, size.z)
    
    // Different aircraft types need different scales
    let targetSize = 15 // Default size
    if (aircraftId.includes('cessna') || aircraftId.includes('archer')) {
      targetSize = 10 // Smaller for general aviation
    } else if (aircraftId.includes('b747') || aircraftId.includes('b777')) {
      targetSize = 30 // Larger for airliners
    } else if (aircraftId.includes('f16') || aircraftId.includes('f18')) {
      targetSize = 12 // Fighter jets
    } else if (aircraftId.includes('a10')) {
      targetSize = 14 // Attack aircraft
    } else if (aircraftId.includes('p51')) {
      targetSize = 9 // WWII fighters
    }
    
    if (maxDimension > 0) {
      const scale = targetSize / maxDimension
      group.scale.setScalar(scale)
    }
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
        id: 'a10',
        definition: {
          dataFile: 'a10.dat',
          modelFile: 'a10.dnm',
          collisionFile: 'a10coll.srf',
          cockpitFile: 'a10cockpit.srf',
          lodFile: 'a10coarse.dnm'
        }
      },
      {
        id: 'f18',
        definition: {
          dataFile: 'f18.dat',
          modelFile: 'f18.dnm',
          collisionFile: 'f18coll.srf',
          cockpitFile: 'f18cockpit.srf',
          lodFile: 'f18_coarse.dnm'
        }
      },
      {
        id: 'p51',
        definition: {
          dataFile: 'p51.dat',
          modelFile: 'p51.dnm',
          collisionFile: 'p51coll.srf',
          cockpitFile: 'p51cockpit.srf',
          lodFile: 'p51coarse.dnm'
        }
      }
    ]
    
    // Load aircraft sequentially to avoid overwhelming the system
    for (const { id, definition } of standardAircraft) {
      try {
        console.log(`Loading aircraft: ${id}`)
        await this.loadAircraft(id, definition)
        console.log(`Successfully loaded aircraft: ${id}`)
      } catch (error) {
        console.error(`Failed to load aircraft ${id}:`, error)
      }
    }
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