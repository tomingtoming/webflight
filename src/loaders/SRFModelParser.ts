import * as THREE from 'three'

export interface SRFVertex {
  x: number
  y: number
  z: number
  isReflected?: boolean // R flag for symmetrical objects
}

export interface SRFNormal {
  x: number
  y: number
  z: number
  flagX: number
  flagY: number
  flagZ: number
}

export interface SRFColor {
  r: number
  g: number
  b: number
  a?: number
}

export interface SRFFace {
  vertices: number[]
  normal?: SRFNormal
  color: SRFColor
  hasBackface?: boolean // B command
  groupId?: number
}

export interface SRFModel {
  vertices: SRFVertex[]
  faces: SRFFace[]
  groups: Map<number, number[]> // group_id -> face_indices
}

export class SRFModelParser {
  /**
   * Parse SRF file content and return a structured model
   */
  static parse(content: string): SRFModel {
    const lines = content.split('\n').map(line => line.trim())
    
    const model: SRFModel = {
      vertices: [],
      faces: [],
      groups: new Map()
    }
    
    console.log('Parsing SRF model, lines:', lines.length)
    
    let currentFace: Partial<SRFFace> | null = null
    let inFaceBlock = false
    let currentGroupId: number | undefined
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line) continue
      
      const parts = line.split(/\s+/)
      const command = parts[0]
      
      switch (command) {
        case 'SURF':
        case 'Surf':
          // Header, initialize
          console.log('SRF file header found')
          break
          
        case 'V':
          if (inFaceBlock && currentFace) {
            // Vertex indices for current face
            const indices = parts.slice(1).map(idx => parseInt(idx))
            if (indices.some(isNaN)) {
              console.warn('Invalid vertex indices in face:', parts.slice(1))
              break
            }
            currentFace.vertices = indices
          } else {
            // Vertex definition
            const x = parseFloat(parts[1])
            const y = parseFloat(parts[2])
            const z = parseFloat(parts[3])
            const isReflected = parts[4] === 'R'
            
            if (isNaN(x) || isNaN(y) || isNaN(z)) {
              console.warn('Invalid vertex coordinates:', parts.slice(1))
              break
            }
            
            model.vertices.push({
              x, y, z,
              isReflected
            })
          }
          break
          
        case 'F':
          // Start face block
          inFaceBlock = true
          currentFace = {
            vertices: [],
            color: { r: 128, g: 128, b: 128 }, // Default gray
            groupId: currentGroupId
          }
          break
          
        case 'E':
          // End face block
          if (inFaceBlock && currentFace && currentFace.vertices && currentFace.vertices.length >= 3) {
            model.faces.push(currentFace as SRFFace)
            
            // Add to group if specified
            if (currentFace.groupId !== undefined) {
              if (!model.groups.has(currentFace.groupId)) {
                model.groups.set(currentFace.groupId, [])
              }
              model.groups.get(currentFace.groupId)!.push(model.faces.length - 1)
            }
          } else if (inFaceBlock) {
            console.warn('Invalid face with insufficient vertices:', currentFace?.vertices?.length || 0)
          }
          inFaceBlock = false
          currentFace = null
          break
          
        case 'N':
          // Normal definition
          if (inFaceBlock && currentFace) {
            const nx = parseFloat(parts[1])
            const ny = parseFloat(parts[2])
            const nz = parseFloat(parts[3])
            const flagX = parseFloat(parts[4]) || 0
            const flagY = parseFloat(parts[5]) || 0
            const flagZ = parseFloat(parts[6]) || 0
            
            if (!isNaN(nx) && !isNaN(ny) && !isNaN(nz)) {
              currentFace.normal = { x: nx, y: ny, z: nz, flagX, flagY, flagZ }
            }
          }
          break
          
        case 'C':
          // Color definition
          if (inFaceBlock && currentFace) {
            currentFace.color = this.parseColor(parts.slice(1))
          }
          break
          
        case 'B':
          // Backface or special material
          if (inFaceBlock && currentFace) {
            currentFace.hasBackface = true
          }
          break
          
        case 'GF':
          // Group Face
          if (parts.length >= 2) {
            currentGroupId = parseInt(parts[1])
            if (!isNaN(currentGroupId)) {
              console.log(`Starting group ${currentGroupId}`)
            }
          }
          break
          
        case 'GE':
          // Group End
          currentGroupId = undefined
          break
          
        default:
          // If we're in a face block and this is a number, it might be a vertex index
          if (inFaceBlock && currentFace && !isNaN(parseInt(command))) {
            const indices = parts.map(idx => parseInt(idx)).filter(idx => !isNaN(idx))
            if (indices.length > 0) {
              currentFace.vertices = (currentFace.vertices || []).concat(indices)
            }
          }
          break
      }
    }
    
    console.log('Parsed SRF model:', {
      vertices: model.vertices.length,
      faces: model.faces.length,
      groups: model.groups.size
    })
    
    // Apply symmetry for reflected vertices
    this.applySymmetry(model)
    
    return model
  }
  
  /**
   * Parse color from command parts
   */
  private static parseColor(parts: string[]): SRFColor {
    if (parts.length === 1) {
      // Single integer color (packed RGB)
      const colorValue = parseInt(parts[0])
      if (!isNaN(colorValue)) {
        return this.unpackColor(colorValue)
      }
    } else if (parts.length >= 3) {
      // RGB format
      const r = parseInt(parts[0])
      const g = parseInt(parts[1])
      const b = parseInt(parts[2])
      const a = parts[3] ? parseInt(parts[3]) : undefined
      
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return { r, g, b, a }
      }
    }
    
    // Default gray
    return { r: 128, g: 128, b: 128 }
  }
  
  /**
   * Unpack single integer color to RGB
   */
  private static unpackColor(colorValue: number): SRFColor {
    // Check if it's 16-bit RGB (5-6-5 format) or 24-bit RGB
    if (colorValue <= 65535) {
      // 16-bit RGB: RRRRR GGGGGG BBBBB
      const r = ((colorValue >> 11) & 0x1F) * 8 // 5 bits for red
      const g = ((colorValue >> 5) & 0x3F) * 4  // 6 bits for green  
      const b = (colorValue & 0x1F) * 8         // 5 bits for blue
      return { r, g, b }
    } else {
      // 24-bit RGB
      const r = (colorValue >> 16) & 0xFF
      const g = (colorValue >> 8) & 0xFF
      const b = colorValue & 0xFF
      return { r, g, b }
    }
  }
  
  /**
   * Apply symmetry by creating mirrored vertices for those marked with R flag
   */
  private static applySymmetry(model: SRFModel): void {
    const originalVertexCount = model.vertices.length
    const vertexMapping = new Map<number, number>() // original_index -> mirrored_index
    
    // Create mirrored vertices
    for (let i = 0; i < originalVertexCount; i++) {
      const vertex = model.vertices[i]
      if (vertex.isReflected) {
        // Create mirrored vertex (mirror across X=0 plane)
        const mirroredVertex: SRFVertex = {
          x: -vertex.x,
          y: vertex.y,
          z: vertex.z,
          isReflected: false // Mirrored vertices don't need the flag
        }
        
        model.vertices.push(mirroredVertex)
        vertexMapping.set(i, model.vertices.length - 1)
      }
    }
    
    // Create mirrored faces
    const originalFaceCount = model.faces.length
    for (let i = 0; i < originalFaceCount; i++) {
      const face = model.faces[i]
      
      // Check if this face uses any reflected vertices
      const usesReflectedVertex = face.vertices.some(vIdx => 
        vIdx < originalVertexCount && model.vertices[vIdx].isReflected
      )
      
      if (usesReflectedVertex) {
        // Create mirrored face with mirrored vertices
        const mirroredVertices = face.vertices.map(vIdx => {
          if (vIdx < originalVertexCount && model.vertices[vIdx].isReflected) {
            return vertexMapping.get(vIdx) || vIdx
          }
          return vIdx
        })
        
        // Reverse vertex order to maintain proper winding for mirrored face
        mirroredVertices.reverse()
        
        const mirroredFace: SRFFace = {
          vertices: mirroredVertices,
          normal: face.normal ? {
            x: -face.normal.x, // Mirror normal X component
            y: face.normal.y,
            z: face.normal.z,
            flagX: face.normal.flagX,
            flagY: face.normal.flagY,
            flagZ: face.normal.flagZ
          } : undefined,
          color: { ...face.color },
          hasBackface: face.hasBackface,
          groupId: face.groupId
        }
        
        model.faces.push(mirroredFace)
        
        // Add to group if specified
        if (mirroredFace.groupId !== undefined) {
          if (!model.groups.has(mirroredFace.groupId)) {
            model.groups.set(mirroredFace.groupId, [])
          }
          model.groups.get(mirroredFace.groupId)!.push(model.faces.length - 1)
        }
      }
    }
    
    console.log(`Applied symmetry: ${originalVertexCount} -> ${model.vertices.length} vertices, ${originalFaceCount} -> ${model.faces.length} faces`)
  }
  
  /**
   * Convert SRF model to Three.js BufferGeometry
   */
  static toThreeJS(model: SRFModel): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry()
    const positions: number[] = []
    const colors: number[] = []
    const normals: number[] = []
    const indices: number[] = []
    
    let vertexIndex = 0
    
    // Convert faces to triangles
    for (const face of model.faces) {
      if (face.vertices.length < 3) {
        console.warn('Skipping face with insufficient vertices:', face.vertices.length)
        continue
      }
      
      // Get face color as Three.js Color
      const faceColor = new THREE.Color(
        face.color.r / 255,
        face.color.g / 255,
        face.color.b / 255
      )
      
      // Calculate face normal if not provided
      let faceNormal: THREE.Vector3
      if (face.normal) {
        faceNormal = new THREE.Vector3(face.normal.x, face.normal.y, face.normal.z).normalize()
      } else {
        // Calculate normal from first 3 vertices
        const v0 = model.vertices[face.vertices[0]]
        const v1 = model.vertices[face.vertices[1]]
        const v2 = model.vertices[face.vertices[2]]
        
        if (v0 && v1 && v2) {
          const edge1 = new THREE.Vector3(v1.x - v0.x, v1.y - v0.y, v1.z - v0.z)
          const edge2 = new THREE.Vector3(v2.x - v0.x, v2.y - v0.y, v2.z - v0.z)
          faceNormal = edge1.cross(edge2).normalize()
        } else {
          faceNormal = new THREE.Vector3(0, 1, 0) // Default up
        }
      }
      
      // Triangulate polygon (fan triangulation from first vertex)
      const firstVertexIdx = face.vertices[0]
      const firstVertex = model.vertices[firstVertexIdx]
      
      if (!firstVertex) {
        console.warn('Invalid first vertex index:', firstVertexIdx)
        continue
      }
      
      for (let i = 1; i < face.vertices.length - 1; i++) {
        const v1Idx = face.vertices[i]
        const v2Idx = face.vertices[i + 1]
        const v1 = model.vertices[v1Idx]
        const v2 = model.vertices[v2Idx]
        
        if (!v1 || !v2) {
          console.warn('Invalid vertex indices:', v1Idx, v2Idx)
          continue
        }
        
        // Add triangle vertices
        positions.push(firstVertex.x, firstVertex.y, firstVertex.z)
        positions.push(v1.x, v1.y, v1.z)
        positions.push(v2.x, v2.y, v2.z)
        
        // Add colors
        colors.push(faceColor.r, faceColor.g, faceColor.b)
        colors.push(faceColor.r, faceColor.g, faceColor.b)
        colors.push(faceColor.r, faceColor.g, faceColor.b)
        
        // Add normals
        normals.push(faceNormal.x, faceNormal.y, faceNormal.z)
        normals.push(faceNormal.x, faceNormal.y, faceNormal.z)
        normals.push(faceNormal.x, faceNormal.y, faceNormal.z)
        
        // Add indices
        indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2)
        vertexIndex += 3
      }
    }
    
    // Set attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geometry.setIndex(indices)
    
    // Compute bounding box and sphere
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    
    console.log('Created SRF geometry:', {
      vertices: positions.length / 3,
      triangles: indices.length / 3,
      boundingBox: geometry.boundingBox
    })
    
    return geometry
  }
  
  /**
   * Load and parse SRF file from URL
   */
  static async loadFromUrl(url: string): Promise<SRFModel> {
    console.log(`Loading SRF file: ${url}`)
    
    // Handle relative URLs in Node.js environment (Vitest test environment)
    const isNodeEnvironment = typeof window === 'undefined' || typeof process !== 'undefined'
    
    if (isNodeEnvironment && url.startsWith('/')) {
      try {
        // In Node.js environment, convert relative path to file path
        // This assumes the public directory is served from the project root
        const path = await import('path')
        const fs = await import('fs')
        const projectRoot = process.cwd()
        const filePath = path.join(projectRoot, 'public', url.slice(1))
        
        console.log(`Node.js environment detected, reading file directly: ${filePath}`)
        
        // Check if file exists before trying to read it
        if (!fs.existsSync(filePath)) {
          throw new Error(`SRF file not found: ${filePath}`)
        }
        
        // Read file directly in Node.js
        const content = fs.readFileSync(filePath, 'utf-8')
        return this.parse(content)
      } catch (error) {
        // If file reading fails, fall back to fetch (might be in a different test environment)
        console.warn('Direct file reading failed, falling back to fetch:', error)
      }
    }
    
    // Browser environment or absolute URL - use fetch
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load SRF file: ${response.status} ${response.statusText}`)
    }
    
    const content = await response.text()
    
    // Check if we got HTML instead of SRF content (404 page)
    if (content.startsWith('<!doctype html>') || content.startsWith('<html')) {
      throw new Error('SRF file not found (got HTML instead of SRF content)')
    }
    
    return this.parse(content)
  }
  
  /**
   * Load SRF file and convert to Three.js geometry in one call
   */
  static async loadGeometryFromUrl(url: string): Promise<THREE.BufferGeometry> {
    const model = await this.loadFromUrl(url)
    return this.toThreeJS(model)
  }
}