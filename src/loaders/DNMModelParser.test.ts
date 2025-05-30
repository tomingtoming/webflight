import { describe, it, expect, beforeAll } from 'vitest'
import { DNMModelParser } from './DNMModelParser'
import * as THREE from 'three'

describe('DNMModelParser', () => {
  describe('parse', () => {
    it('should parse basic DNM header', async () => {
      const content = `DYNAMODEL
DNMVER 1
SURF
V 0.0 0.0 0.0
V 1.0 0.0 0.0
V 0.0 1.0 0.0
C 255 0 0
B
0
1
2
E`
      const model = await DNMModelParser.parse(content)
      
      expect(model.version).toBe(1)
      expect(model.vertices).toHaveLength(3)
      expect(model.polygons).toHaveLength(1)
    })

    it('should parse vertices correctly', async () => {
      const content = `DYNAMODEL
SURF
V 1.5 2.5 3.5
V -1.0 -2.0 -3.0 R`
      
      const model = await DNMModelParser.parse(content)
      
      expect(model.vertices[0]).toEqual({ x: 1.5, y: 2.5, z: 3.5, isRound: false })
      expect(model.vertices[1]).toEqual({ x: -1.0, y: -2.0, z: -3.0, isRound: true })
    })

    it('should parse polygons with colors', async () => {
      const content = `DYNAMODEL
SURF
V 0.0 0.0 0.0
V 1.0 0.0 0.0
V 1.0 1.0 0.0
V 0.0 1.0 0.0
C 255 128 64
B
0
1
2
3
E`
      
      const model = await DNMModelParser.parse(content)
      
      expect(model.polygons[0].vertices).toEqual([0, 1, 2, 3])
      expect(model.polygons[0].color).toEqual({ r: 255, g: 128, b: 64 })
    })

    it('should handle packed DNM format', async () => {
      const content = `DYNAMODEL
PCK "f16cockpit" 100
SURF
V 0.0 0.0 0.0
V 1.0 0.0 0.0
V 0.0 1.0 0.0`
      
      const model = await DNMModelParser.parse(content, '/aircraft/f16.dnm')
      
      expect(model.vertices).toHaveLength(3)
      // In packed format, polygons come from SRF files
      // Without actual SRF files, we should get fallback triangulation
      expect(model.polygons.length).toBeGreaterThan(0)
    })

    it('should calculate normals for polygons', async () => {
      const content = `DYNAMODEL
SURF
V 0.0 0.0 0.0
V 1.0 0.0 0.0
V 0.0 0.0 1.0
C 255 255 255
B
0
1
2
E`
      
      const model = await DNMModelParser.parse(content)
      
      expect(model.polygons[0].normal).toBeDefined()
      expect(model.polygons[0].normal).toBeInstanceOf(THREE.Vector3)
      
      // Normal should point downward (negative Y) for this triangle
      // because of the vertex order (0,0,0) -> (1,0,0) -> (0,0,1)
      const normal = model.polygons[0].normal!
      expect(normal.y).toBeCloseTo(-1.0, 5)
      expect(normal.x).toBeCloseTo(0.0, 5)
      expect(normal.z).toBeCloseTo(0.0, 5)
    })

    it('should handle empty or invalid content', async () => {
      const emptyModel = await DNMModelParser.parse('')
      expect(emptyModel.vertices).toHaveLength(0)
      expect(emptyModel.polygons).toHaveLength(0)
      
      const invalidModel = await DNMModelParser.parse('INVALID DATA')
      expect(invalidModel.vertices).toHaveLength(0)
      expect(invalidModel.polygons).toHaveLength(0)
    })
  })

  describe('toThreeJS', () => {
    it('should convert DNM model to BufferGeometry', async () => {
      const content = `DYNAMODEL
SURF
V 0.0 0.0 0.0
V 1.0 0.0 0.0
V 1.0 1.0 0.0
V 0.0 1.0 0.0
C 255 0 0
B
0
1
2
3
E`
      
      const model = await DNMModelParser.parse(content)
      const geometry = DNMModelParser.toThreeJS(model)
      
      expect(geometry).toBeInstanceOf(THREE.BufferGeometry)
      expect(geometry.attributes.position).toBeDefined()
      expect(geometry.attributes.color).toBeDefined()
      expect(geometry.attributes.normal).toBeDefined()
      
      // Check vertex count (quad becomes 2 triangles = 6 vertices)
      const positions = geometry.attributes.position.array
      expect(positions.length).toBe(18) // 6 vertices * 3 components
    })

    it('should handle coordinate system conversion', async () => {
      const content = `DYNAMODEL
SURF
V 1.0 2.0 3.0
V 4.0 5.0 6.0
V 7.0 8.0 9.0
C 255 255 255
B
0
1
2
E`
      
      const model = await DNMModelParser.parse(content)
      const geometry = DNMModelParser.toThreeJS(model)
      
      // YSFlight uses Y-up, Z-forward
      // Three.js uses Y-up, Z-backward
      // So Z coordinates should be negated (handled in AircraftManager)
      const positions = geometry.attributes.position.array
      expect(positions[0]).toBe(1.0) // X unchanged
      expect(positions[1]).toBe(2.0) // Y unchanged
      expect(positions[2]).toBe(3.0) // Z will be negated in AircraftManager
    })

    it('should preserve vertex colors', async () => {
      const content = `DYNAMODEL
SURF
V 0.0 0.0 0.0
V 1.0 0.0 0.0
V 0.0 1.0 0.0
C 255 128 64
B
0
1
2
E`
      
      const model = await DNMModelParser.parse(content)
      const geometry = DNMModelParser.toThreeJS(model)
      
      const colors = geometry.attributes.color.array
      expect(colors[0]).toBeCloseTo(1.0, 2)    // R: 255/255
      expect(colors[1]).toBeCloseTo(0.502, 2)  // G: 128/255
      expect(colors[2]).toBeCloseTo(0.251, 2)  // B: 64/255
    })
  })

  describe('createSimpleTriangulation', () => {
    it('should create triangles from vertices when no polygons exist', async () => {
      const content = `DYNAMODEL
SURF
V 0.0 0.0 0.0
V 1.0 0.0 0.0
V 0.0 1.0 0.0
V 1.0 1.0 0.0
V 0.5 0.5 1.0
V 1.5 0.5 1.0`
      
      const model = await DNMModelParser.parse(content)
      
      // Should create triangles from sequential vertices
      expect(model.polygons).toHaveLength(2) // 6 vertices / 3 = 2 triangles
      expect(model.polygons[0].vertices).toEqual([0, 1, 2])
      expect(model.polygons[1].vertices).toEqual([3, 4, 5])
    })
  })
})