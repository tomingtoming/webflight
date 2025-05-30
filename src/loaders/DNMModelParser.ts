import * as THREE from 'three'

export interface DNMVertex {
  x: number
  y: number
  z: number
  isRound?: boolean
}

export interface DNMPolygon {
  vertices: number[]
  color: { r: number; g: number; b: number }
  normal?: THREE.Vector3
}

export interface DNMModel {
  version: number
  vertices: DNMVertex[]
  polygons: DNMPolygon[]
  surfaceFile?: string
}

export class DNMModelParser {
  static async parse(content: string, modelPath?: string): Promise<DNMModel> {
    const lines = content.split('\n').map(line => line.trim())
    
    const model: DNMModel = {
      version: 1,
      vertices: [],
      polygons: []
    }
    
    console.log('Parsing DNM model, lines:', lines.length)
    
    let currentMode = ''
    let currentPolygon: Partial<DNMPolygon> | null = null
    let currentColor = { r: 128, g: 128, b: 128 } // Default gray color
    let isPacked = false
    const packedSections: Array<{ surfaceFile: string; vertexCount: number; vertices: DNMVertex[] }> = []
    
    for (const line of lines) {
      if (!line) continue
      
      const parts = line.split(/\s+/)
      const command = parts[0]
      
      switch (command) {
        case 'DYNAMODEL':
          // Header, ignore
          break
          
        case 'DNMVER':
          model.version = parseInt(parts[1])
          break
          
        case 'PCK': {
          const surfaceFile = parts[1].replace(/"/g, '') // Remove quotes
          const vertexCount = parseInt(parts[2] || '0')
          isPacked = true
          console.log(`DNM uses packed format: ${surfaceFile}, vertices: ${vertexCount}`)
          
          // Ensure SRF extension
          const srfFileName = surfaceFile.endsWith('.srf') ? surfaceFile : `${surfaceFile}.srf`
          
          // Store current section info
          packedSections.push({
            surfaceFile: srfFileName,
            vertexCount,
            vertices: []
          })
          break
        }
          
        case 'SURF':
        case 'Surf':
          currentMode = 'SURF'
          break
          
        case 'V':
          // Vertex definition
          if (currentMode === 'SURF') {
            const vertex: DNMVertex = {
              x: parseFloat(parts[1]),
              y: parseFloat(parts[2]),
              z: parseFloat(parts[3]),
              isRound: parts[4] === 'R'
            }
            
            // If this is a packed format, add to current section
            if (isPacked && packedSections.length > 0) {
              const currentSection = packedSections[packedSections.length - 1]
              currentSection.vertices.push(vertex)
            }
            
            model.vertices.push(vertex)
          }
          break
          
        case 'C':
          // Color definition
          currentColor = {
            r: parseInt(parts[1]),
            g: parseInt(parts[2]),
            b: parseInt(parts[3])
          }
          break
          
        case 'B':
          // Begin polygon
          currentPolygon = {
            vertices: [],
            color: { ...currentColor }
          }
          break
          
        case 'E':
          // End polygon
          if (currentPolygon && currentPolygon.vertices!.length >= 3) {
            model.polygons.push(currentPolygon as DNMPolygon)
          }
          currentPolygon = null
          break
          
        default:
          // If we're in a polygon and the line is a number, it's a vertex index
          if (currentPolygon && !isNaN(parseInt(command))) {
            currentPolygon.vertices!.push(parseInt(command))
          }
          break
      }
    }
    
    // If this is a packed model, try to load SRF files
    if (isPacked && model.polygons.length === 0 && packedSections.length > 0) {
      console.log('Packed DNM format detected, attempting to load SRF files')
      
      if (modelPath) {
        for (const section of packedSections) {
          try {
            await this.loadSRFSection(section, model, modelPath)
          } catch (error) {
            console.warn(`Failed to load SRF file ${section.surfaceFile}:`, error)
          }
        }
      }
      
      // If still no polygons after SRF loading, create fallback mesh
      if (model.polygons.length === 0 && model.vertices.length > 0) {
        console.log('No SRF polygons loaded, creating fallback aircraft mesh from vertices')
        model.polygons = this.createSimpleTriangulation(model.vertices)
      }
    } else if (model.polygons.length === 0 && model.vertices.length > 0) {
      console.log('No polygons found, creating triangulated mesh from vertices')
      // Create triangles from sequential vertices (simple triangulation)
      for (let i = 0; i < model.vertices.length - 2; i += 3) {
        model.polygons.push({
          vertices: [i, i + 1, i + 2],
          color: { ...currentColor }
        })
      }
    }
    
    // Calculate normals for polygons
    for (const polygon of model.polygons) {
      if (polygon.vertices.length >= 3) {
        const v0 = model.vertices[polygon.vertices[0]]
        const v1 = model.vertices[polygon.vertices[1]]
        const v2 = model.vertices[polygon.vertices[2]]
        
        if (v0 && v1 && v2) {
          const edge1 = new THREE.Vector3(v1.x - v0.x, v1.y - v0.y, v1.z - v0.z)
          const edge2 = new THREE.Vector3(v2.x - v0.x, v2.y - v0.y, v2.z - v0.z)
          
          polygon.normal = edge1.cross(edge2).normalize()
        }
      }
    }
    
    console.log('Parsed model:', {
      vertices: model.vertices.length,
      polygons: model.polygons.length
    })
    
    return model
  }
  
  // Create aircraft-like polygons from vertices using convex hull approach
  // Commented out as this method is not currently used
  /*
  private static createAircraftPolygons(vertices: DNMVertex[]): DNMPolygon[] {
    const polygons: DNMPolygon[] = []
    
    // Analyze vertex bounds to understand the aircraft shape
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    let minZ = Infinity, maxZ = -Infinity
    
    vertices.forEach(v => {
      minX = Math.min(minX, v.x)
      maxX = Math.max(maxX, v.x)
      minY = Math.min(minY, v.y)
      maxY = Math.max(maxY, v.y)
      minZ = Math.min(minZ, v.z)
      maxZ = Math.max(maxZ, v.z)
    })
    
    console.log('Vertex bounds:', { 
      x: [minX, maxX], 
      y: [minY, maxY], 
      z: [minZ, maxZ] 
    })
    
    // Group vertices by sections (nose, body, tail, wings)
    const noseVertices: number[] = []
    const bodyVertices: number[] = []
    const tailVertices: number[] = []
    const wingVertices: number[] = []
    
    vertices.forEach((v, i) => {
      if (v.z > maxZ * 0.7) {
        noseVertices.push(i)
      } else if (v.z < minZ * 0.7) {
        tailVertices.push(i)
      } else if (Math.abs(v.x) > maxX * 0.5) {
        wingVertices.push(i)
      } else {
        bodyVertices.push(i)
      }
    })
    
    // Create fuselage polygons using a cylindrical approach
    const fuselageColor = { r: 150, g: 150, b: 150 }
    
    // Sort body vertices by z-coordinate
    const sortedBody = [...bodyVertices].sort((a, b) => vertices[a].z - vertices[b].z)
    
    // Create strips along the fuselage
    for (let i = 0; i < sortedBody.length - 1; i++) {
      // const v1 = sortedBody[i]
      // const v2 = sortedBody[i + 1]
      
      // Find closest vertices on opposite sides
      const leftVerts = sortedBody.filter(idx => vertices[idx].x < 0)
      const rightVerts = sortedBody.filter(idx => vertices[idx].x >= 0)
      
      if (leftVerts.length > 0 && rightVerts.length > 0) {
        // Create quad strips
        for (let j = 0; j < Math.min(leftVerts.length - 1, rightVerts.length - 1); j++) {
          polygons.push({
            vertices: [leftVerts[j], rightVerts[j], rightVerts[j + 1], leftVerts[j + 1]],
            color: fuselageColor
          })
        }
      }
    }
    
    // Create nose cone
    if (noseVertices.length > 0) {
      const noseColor = { r: 100, g: 100, b: 200 }
      const noseTip = noseVertices.reduce((max, idx) => 
        vertices[idx].z > vertices[max].z ? idx : max, noseVertices[0])
      
      for (let i = 0; i < noseVertices.length - 1; i++) {
        if (noseVertices[i] !== noseTip) {
          polygons.push({
            vertices: [noseTip, noseVertices[i], noseVertices[i + 1]],
            color: noseColor
          })
        }
      }
    }
    
    // Create wing surfaces
    if (wingVertices.length > 0) {
      const wingColor = { r: 180, g: 180, b: 180 }
      const leftWing = wingVertices.filter(idx => vertices[idx].x < 0)
      const rightWing = wingVertices.filter(idx => vertices[idx].x > 0)
      
      // Simple wing triangulation
      this.createWingPolygons(leftWing, vertices, polygons, wingColor)
      this.createWingPolygons(rightWing, vertices, polygons, wingColor)
    }
    
    // Create tail surfaces
    if (tailVertices.length > 0) {
      const tailColor = { r: 160, g: 160, b: 160 }
      const tailEnd = tailVertices.reduce((min, idx) => 
        vertices[idx].z < vertices[min].z ? idx : min, tailVertices[0])
      
      for (let i = 0; i < tailVertices.length - 1; i++) {
        if (tailVertices[i] !== tailEnd) {
          polygons.push({
            vertices: [tailEnd, tailVertices[i], tailVertices[i + 1]],
            color: tailColor
          })
        }
      }
    }
    
    // If we still don't have enough polygons, use simple triangulation
    if (polygons.length < 10) {
      console.log('Using fallback triangulation')
      const color = { r: 128, g: 128, b: 200 }
      
      // Simple triangulation of vertices in groups of 3
      for (let i = 0; i < vertices.length - 2; i += 3) {
        if (i + 2 < vertices.length) {
          polygons.push({
            vertices: [i, i + 1, i + 2],
            color: color
          })
        }
      }
      
      // Limit the number of polygons to prevent explosion
      if (polygons.length > 10000) {
        console.warn(`Too many fallback polygons (${polygons.length}), truncating to 10000`)
        polygons.splice(10000)
      }
    }
    
    console.log(`Created ${polygons.length} polygons from ${vertices.length} vertices`)
    return polygons
  }
  
  private static createWingPolygons(
    wingIndices: number[], 
    vertices: DNMVertex[], 
    polygons: DNMPolygon[],
    color: { r: number; g: number; b: number }
  ): void {
    if (wingIndices.length < 3) return
    
    // Sort by z-coordinate for strip generation
    const sorted = [...wingIndices].sort((a, b) => vertices[a].z - vertices[b].z)
    
    for (let i = 0; i < sorted.length - 1; i++) {
      polygons.push({
        vertices: [sorted[0], sorted[i], sorted[i + 1]],
        color: color
      })
    }
  }
  */
  
  static toThreeJS(model: DNMModel): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry()
    const positions: number[] = []
    const colors: number[] = []
    const normals: number[] = []
    const indices: number[] = []
    
    // Convert polygons to triangles
    let vertexIndex = 0
    
    for (const polygon of model.polygons) {
      if (polygon.vertices.length < 3) continue
      
      // Get polygon color
      const color = new THREE.Color(
        polygon.color.r / 255,
        polygon.color.g / 255,
        polygon.color.b / 255
      )
      
      // Triangulate polygon (simple fan triangulation)
      const firstVertex = polygon.vertices[0]
      
      for (let i = 1; i < polygon.vertices.length - 1; i++) {
        const v0 = model.vertices[firstVertex]
        const v1 = model.vertices[polygon.vertices[i]]
        const v2 = model.vertices[polygon.vertices[i + 1]]
        
        // Add vertices
        positions.push(v0.x, v0.y, v0.z)
        positions.push(v1.x, v1.y, v1.z)
        positions.push(v2.x, v2.y, v2.z)
        
        // Add colors
        colors.push(color.r, color.g, color.b)
        colors.push(color.r, color.g, color.b)
        colors.push(color.r, color.g, color.b)
        
        // Add normals
        if (polygon.normal) {
          for (let j = 0; j < 3; j++) {
            normals.push(polygon.normal.x, polygon.normal.y, polygon.normal.z)
          }
        }
        
        // Add indices
        indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2)
        vertexIndex += 3
      }
    }
    
    // Set attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    
    if (normals.length > 0) {
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    } else {
      geometry.computeVertexNormals()
    }
    
    geometry.setIndex(indices)
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    
    console.log('Created geometry:', {
      vertices: positions.length / 3,
      triangles: indices.length / 3,
      boundingBox: geometry.boundingBox
    })
    
    return geometry
  }

  private static async loadSRFSection(
    section: { surfaceFile: string; vertexCount: number; vertices: DNMVertex[] },
    model: DNMModel,
    modelPath: string
  ): Promise<void> {
    // Construct SRF file path
    const modelDir = modelPath.substring(0, modelPath.lastIndexOf('/'))
    const srfPath = `${modelDir}/${section.surfaceFile}`
    
    console.log(`Loading SRF file: ${srfPath}`)
    console.log(`Section has ${section.vertices.length} vertices:`, section.vertices.slice(0, 3))
    
    try {
      const response = await fetch(srfPath)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const srfContent = await response.text()
      
      // Check if we got HTML instead of SRF content
      if (srfContent.startsWith('<!doctype html>') || srfContent.startsWith('<html')) {
        throw new Error(`Got HTML instead of SRF content - file not found`)
      }
      
      console.log(`SRF content sample:`, srfContent.substring(0, 100))
      
      const srfPolygons = this.parseSRFFile(srfContent, model.vertices, section)
      
      // Add polygons to model
      model.polygons.push(...srfPolygons)
      
      console.log(`Loaded ${srfPolygons.length} polygons from ${section.surfaceFile}`)
      if (srfPolygons.length > 0) {
        console.log(`Sample polygon:`, srfPolygons[0])
      }
    } catch (error) {
      console.warn(`Failed to load SRF file ${srfPath}:`, error instanceof Error ? error.message : String(error))
      // Don't throw the error, let it fall back to automatic mesh generation
    }
  }

  private static parseSRFFile(
    content: string, 
    allVertices: DNMVertex[], 
    section: { surfaceFile: string; vertexCount: number; vertices: DNMVertex[] }
  ): DNMPolygon[] {
    const lines = content.split('\n').map(line => line.trim())
    const polygons: DNMPolygon[] = []
    
    console.log(`Parsing SRF with ${lines.length} lines for ${section.vertices.length} section vertices, ${allVertices.length} total vertices`)
    
    let currentColor = { r: 128, g: 128, b: 128 }
    // let vertexOffset = 0
    let inPolygon = false
    let currentVertices: number[] = []
    let polyCount = 0
    
    for (const line of lines) {
      if (!line) continue
      
      const parts = line.split(/\s+/)
      const command = parts[0]
      
      switch (command) {
        case 'SURF':
          // Start of surface definition
          break
          
        case 'V':
          // Handle vertices in different contexts
          if (inPolygon) {
            // Vertex indices for polygon - this happens in F blocks
            if (parts.length > 1) {
              for (let i = 1; i < parts.length; i++) {
                const vertexIndex = parseInt(parts[i]) - 1 // Convert to 0-based
                if (vertexIndex >= 0 && vertexIndex < allVertices.length) {
                  currentVertices.push(vertexIndex)
                } else {
                  console.warn(`Invalid vertex index ${vertexIndex} (0-based) in SRF, max is ${allVertices.length - 1}`)
                }
              }
            }
          } else {
            // Vertex definition - we already have these from the DNM file
            // vertexOffset++
          }
          break
          
        case 'C':
          // Color definition (16-bit packed RGB)
          if (parts.length >= 2) {
            const colorValue = parseInt(parts[1])
            // Convert 16-bit RGB to separate components
            currentColor = {
              r: ((colorValue >> 11) & 0x1F) * 8, // 5 bits for red
              g: ((colorValue >> 5) & 0x3F) * 4,  // 6 bits for green  
              b: (colorValue & 0x1F) * 8           // 5 bits for blue
            }
          }
          break
          
        case 'F':
          // Start polygon (face)
          inPolygon = true
          currentVertices = []
          break
          
        case 'E':
          // End polygon
          if (inPolygon && currentVertices.length >= 3) {
            polygons.push({
              vertices: [...currentVertices],
              color: { ...currentColor }
            })
            polyCount++
            if (polyCount <= 3) {
              console.log(`Polygon ${polyCount}: vertices=${currentVertices}, color=${JSON.stringify(currentColor)}`)
            }
          } else if (inPolygon) {
            console.warn(`Skipping invalid polygon with ${currentVertices.length} vertices:`, currentVertices)
          }
          inPolygon = false
          currentVertices = []
          break
          
        default:
          // If we're in a polygon and this is a number, it's a vertex index
          if (inPolygon && !isNaN(parseInt(command))) {
            const vertexIndex = parseInt(command) - 1 // Convert to 0-based
            if (vertexIndex >= 0 && vertexIndex < allVertices.length) {
              currentVertices.push(vertexIndex)
            } else {
              console.warn(`Invalid single vertex index ${vertexIndex} (0-based) in SRF, max is ${allVertices.length - 1}`)
            }
          }
          break
      }
    }
    
    return polygons
  }

  // Simple triangulation method for fallback when SRF files are not available
  private static createSimpleTriangulation(vertices: DNMVertex[]): DNMPolygon[] {
    const polygons: DNMPolygon[] = []
    const color = { r: 150, g: 150, b: 150 }
    
    console.log(`Creating simple triangulation for ${vertices.length} vertices`)
    
    // Create triangles using every 3 consecutive vertices
    for (let i = 0; i < vertices.length - 2; i += 3) {
      if (i + 2 < vertices.length) {
        polygons.push({
          vertices: [i, i + 1, i + 2],
          color: color
        })
      }
    }
    
    // If we have leftover vertices, try to create triangles with wrapping
    const remainder = vertices.length % 3
    if (remainder === 1 && vertices.length >= 4) {
      // Use last vertex with first two
      polygons.push({
        vertices: [vertices.length - 1, 0, 1],
        color: color
      })
    } else if (remainder === 2 && vertices.length >= 5) {
      // Use last two vertices with first
      polygons.push({
        vertices: [vertices.length - 2, vertices.length - 1, 0],
        color: color
      })
    }
    
    console.log(`Created ${polygons.length} simple triangles`)
    return polygons
  }
}