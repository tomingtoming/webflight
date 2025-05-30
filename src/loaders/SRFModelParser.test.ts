import { describe, it, expect } from 'vitest'
import { SRFModelParser } from './SRFModelParser'

describe('SRFModelParser', () => {
  describe('parseColor', () => {
    it('should parse single integer color (16-bit RGB)', () => {
      const srfContent = `
SURF
V 0 0 0
V 1 0 0  
V 0 1 0
F
V 0 1 2
C 16912
E
`
      const model = SRFModelParser.parse(srfContent)
      expect(model.faces).toHaveLength(1)
      
      const face = model.faces[0]
      // 16912 in 16-bit RGB: should be some shade of gray
      expect(face.color.r).toBeGreaterThan(0)
      expect(face.color.g).toBeGreaterThan(0)
      expect(face.color.b).toBeGreaterThan(0)
    })

    it('should parse RGB color format', () => {
      const srfContent = `
SURF
V 0 0 0
V 1 0 0
V 0 1 0
F
V 0 1 2
C 255 128 64
E
`
      const model = SRFModelParser.parse(srfContent)
      expect(model.faces).toHaveLength(1)
      
      const face = model.faces[0]
      expect(face.color.r).toBe(255)
      expect(face.color.g).toBe(128)
      expect(face.color.b).toBe(64)
    })
  })

  describe('vertex parsing', () => {
    it('should parse regular vertices', () => {
      const srfContent = `
SURF
V 1.5 2.0 3.5
V -1.0 0.0 1.0
`
      const model = SRFModelParser.parse(srfContent)
      expect(model.vertices).toHaveLength(2)
      
      expect(model.vertices[0]).toEqual({
        x: 1.5, y: 2.0, z: 3.5,
        isReflected: false
      })
      
      expect(model.vertices[1]).toEqual({
        x: -1.0, y: 0.0, z: 1.0,
        isReflected: false
      })
    })

    it('should parse reflected vertices with R flag', () => {
      const srfContent = `
SURF
V 1.0 2.0 3.0 R
V 4.0 5.0 6.0
`
      const model = SRFModelParser.parse(srfContent)
      expect(model.vertices).toHaveLength(3) // Original + mirrored
      
      expect(model.vertices[0]).toEqual({
        x: 1.0, y: 2.0, z: 3.0,
        isReflected: true
      })
      
      // Mirrored vertex should be created
      expect(model.vertices[2]).toEqual({
        x: -1.0, y: 2.0, z: 3.0, // X mirrored
        isReflected: false
      })
    })
  })

  describe('face parsing', () => {
    it('should parse basic face with vertices, normal, and color', () => {
      const srfContent = `
SURF
V 0 0 0
V 1 0 0
V 0 1 0
F
V 0 1 2
N 0 0 1 0 0 0
C 255 0 0
E
`
      const model = SRFModelParser.parse(srfContent)
      expect(model.faces).toHaveLength(1)
      
      const face = model.faces[0]
      expect(face.vertices).toEqual([0, 1, 2])
      expect(face.normal).toEqual({
        x: 0, y: 0, z: 1,
        flagX: 0, flagY: 0, flagZ: 0
      })
      expect(face.color).toEqual({
        r: 255, g: 0, b: 0
      })
    })

    it('should parse face with backface flag', () => {
      const srfContent = `
SURF
V 0 0 0
V 1 0 0
V 0 1 0
F
B
V 0 1 2
C 0
E
`
      const model = SRFModelParser.parse(srfContent)
      expect(model.faces).toHaveLength(1)
      expect(model.faces[0].hasBackface).toBe(true)
    })
  })

  describe('symmetry application', () => {
    it('should create mirrored faces for reflected vertices', () => {
      const srfContent = `
SURF
V 1.0 0.0 0.0 R
V 0.0 1.0 0.0
V 0.0 0.0 1.0
F
V 0 1 2
C 255 255 255
E
`
      const model = SRFModelParser.parse(srfContent)
      
      // Should have original + mirrored vertex
      expect(model.vertices).toHaveLength(4)
      expect(model.vertices[3]).toEqual({
        x: -1.0, y: 0.0, z: 0.0,
        isReflected: false
      })
      
      // Should have original + mirrored face
      expect(model.faces).toHaveLength(2)
      
      // Original face
      expect(model.faces[0].vertices).toEqual([0, 1, 2])
      
      // Mirrored face (vertex order reversed, using mirrored vertex)
      expect(model.faces[1].vertices).toEqual([2, 1, 3])
    })
  })

  describe('groups', () => {
    it('should parse group commands', () => {
      const srfContent = `
SURF
V 0 0 0
V 1 0 0
V 0 1 0
GF 1
F
V 0 1 2
C 255 255 255
E
GE 1
`
      const model = SRFModelParser.parse(srfContent)
      
      expect(model.groups.has(1)).toBe(true)
      expect(model.groups.get(1)).toEqual([0]) // Face index 0
      expect(model.faces[0].groupId).toBe(1)
    })
  })

  describe('Three.js conversion', () => {
    it('should convert simple triangle to BufferGeometry', () => {
      const srfContent = `
SURF
V 0 0 0
V 1 0 0
V 0 1 0
F
V 0 1 2
N 0 0 1 0 0 0
C 255 0 0
E
`
      const model = SRFModelParser.parse(srfContent)
      const geometry = SRFModelParser.toThreeJS(model)
      
      expect(geometry.attributes.position).toBeDefined()
      expect(geometry.attributes.color).toBeDefined()
      expect(geometry.attributes.normal).toBeDefined()
      
      // Should have 3 vertices for 1 triangle
      expect(geometry.attributes.position.count).toBe(3)
      
      // Should have proper bounding box
      expect(geometry.boundingBox).toBeDefined()
    })

    it('should triangulate quad faces', () => {
      const srfContent = `
SURF
V 0 0 0
V 1 0 0
V 1 1 0
V 0 1 0
F
V 0 1 2 3
C 255 255 255
E
`
      const model = SRFModelParser.parse(srfContent)
      const geometry = SRFModelParser.toThreeJS(model)
      
      // Quad should be triangulated into 2 triangles = 6 vertices
      expect(geometry.attributes.position.count).toBe(6)
      
      // Should have 2 triangles
      expect(geometry.index?.count).toBe(6)
    })
  })

  describe('error handling', () => {
    it('should handle invalid vertex coordinates gracefully', () => {
      const srfContent = `
SURF
V invalid coords here
V 1 0 0
V 0 1 0
F
V 1 2 1
C 255 255 255
E
`
      const model = SRFModelParser.parse(srfContent)
      
      // Should skip invalid vertex, only have 2 valid vertices
      expect(model.vertices).toHaveLength(2)
      expect(model.faces).toHaveLength(1)
    })

    it('should skip faces with insufficient vertices', () => {
      const srfContent = `
SURF
V 0 0 0
V 1 0 0
F
V 0 1
C 255 255 255
E
F
V 0 1 1
C 255 255 255
E
`
      const model = SRFModelParser.parse(srfContent)
      
      // Should skip first face (only 2 vertices), keep second face
      expect(model.faces).toHaveLength(1)
      expect(model.faces[0].vertices).toEqual([0, 1, 1])
    })
  })
})