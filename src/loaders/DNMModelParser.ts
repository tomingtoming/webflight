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
  static parse(content: string): DNMModel {
    const lines = content.split('\n').map(line => line.trim())
    
    const model: DNMModel = {
      version: 1,
      vertices: [],
      polygons: []
    }
    
    let currentMode = ''
    let currentPolygon: Partial<DNMPolygon> | null = null
    let currentColor = { r: 255, g: 255, b: 255 }
    
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
          
        case 'PCK':
          model.surfaceFile = parts[1]
          break
          
        case 'SURF':
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
    
    // Calculate normals for polygons
    for (const polygon of model.polygons) {
      if (polygon.vertices.length >= 3) {
        const v0 = model.vertices[polygon.vertices[0]]
        const v1 = model.vertices[polygon.vertices[1]]
        const v2 = model.vertices[polygon.vertices[2]]
        
        const edge1 = new THREE.Vector3(v1.x - v0.x, v1.y - v0.y, v1.z - v0.z)
        const edge2 = new THREE.Vector3(v2.x - v0.x, v2.y - v0.y, v2.z - v0.z)
        
        polygon.normal = edge1.cross(edge2).normalize()
      }
    }
    
    return model
  }
  
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
    
    return geometry
  }
}