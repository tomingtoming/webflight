import { describe, it, expect, vi } from 'vitest'
import { DNMModelParser } from './DNMModelParser'
import * as THREE from 'three'

// No longer need fetch mocking for simplified parser

describe('DNMModelParser', () => {
  describe('parse', () => {
    it('should parse basic DNM header', () => {
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
      const model = DNMModelParser.parse(content)
      
      expect(model.version).toBe(1)
      expect(model.vertices).toHaveLength(3)
      expect(model.polygons).toHaveLength(1)
    })

    it('should parse vertices correctly', () => {
      const content = `DYNAMODEL
SURF
V 1.5 2.5 3.5
V -1.0 -2.0 -3.0 R`
      
      const model = DNMModelParser.parse(content)
      
      expect(model.vertices[0]).toEqual({ x: 1.5, y: 2.5, z: 3.5, isRound: false })
      expect(model.vertices[1]).toEqual({ x: -1.0, y: -2.0, z: -3.0, isRound: true })
    })

    it('should parse polygons with colors', () => {
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
      
      const model = DNMModelParser.parse(content)
      
      expect(model.polygons[0].vertices).toEqual([0, 1, 2, 3])
      expect(model.polygons[0].color).toEqual({ r: 255, g: 128, b: 64 })
    })

    it('should warn about unsupported PCK format', () => {
      const content = `DYNAMODEL
PCK "f16cockpit" 100
SURF
V 0.0 0.0 0.0
V 1.0 0.0 0.0
V 0.0 1.0 0.0`
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const model = DNMModelParser.parse(content)
      
      expect(model.vertices).toHaveLength(3)
      // PCK format not supported in simplified parser, should create fallback triangulation
      expect(model.polygons.length).toBeGreaterThan(0)
      expect(consoleSpy).toHaveBeenCalledWith('PCK format not supported in simplified parser')
      
      consoleSpy.mockRestore()
    })

    it('should calculate normals for polygons', () => {
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
      
      const model = DNMModelParser.parse(content)
      
      expect(model.polygons[0].normal).toBeDefined()
      expect(model.polygons[0].normal).toBeInstanceOf(THREE.Vector3)
      
      // Normal should point downward (negative Y) for this triangle
      // because of the vertex order (0,0,0) -> (1,0,0) -> (0,0,1)
      const normal = model.polygons[0].normal!
      expect(normal.y).toBeCloseTo(-1.0, 5)
      expect(normal.x).toBeCloseTo(0.0, 5)
      expect(normal.z).toBeCloseTo(0.0, 5)
    })

    it('should handle empty or invalid content', () => {
      const emptyModel = DNMModelParser.parse('')
      expect(emptyModel.vertices).toHaveLength(0)
      expect(emptyModel.polygons).toHaveLength(0)
      
      const invalidModel = DNMModelParser.parse('INVALID DATA')
      expect(invalidModel.vertices).toHaveLength(0)
      expect(invalidModel.polygons).toHaveLength(0)
    })
  })

  describe('toThreeJS', () => {
    it('should convert DNM model to BufferGeometry', () => {
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
      
      const model = DNMModelParser.parse(content)
      const geometry = DNMModelParser.toThreeJS(model)
      
      expect(geometry).toBeInstanceOf(THREE.BufferGeometry)
      expect(geometry.attributes.position).toBeDefined()
      expect(geometry.attributes.color).toBeDefined()
      expect(geometry.attributes.normal).toBeDefined()
      
      // Check vertex count (quad becomes 2 triangles = 6 vertices)
      const positions = geometry.attributes.position.array
      expect(positions.length).toBe(18) // 6 vertices * 3 components
    })

    it('should handle coordinate system conversion', () => {
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
      
      const model = DNMModelParser.parse(content)
      const geometry = DNMModelParser.toThreeJS(model)
      
      // YSFlight uses Y-up, Z-forward
      // Three.js uses Y-up, Z-backward
      // So Z coordinates should be negated (handled in AircraftManager)
      const positions = geometry.attributes.position.array
      expect(positions[0]).toBe(1.0) // X unchanged
      expect(positions[1]).toBe(2.0) // Y unchanged
      expect(positions[2]).toBe(3.0) // Z will be negated in AircraftManager
    })

    it('should preserve vertex colors', () => {
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
      
      const model = DNMModelParser.parse(content)
      const geometry = DNMModelParser.toThreeJS(model)
      
      const colors = geometry.attributes.color.array
      expect(colors[0]).toBeCloseTo(1.0, 2)    // R: 255/255
      expect(colors[1]).toBeCloseTo(0.502, 2)  // G: 128/255
      expect(colors[2]).toBeCloseTo(0.251, 2)  // B: 64/255
    })
  })

  describe('createSimpleTriangulation', () => {
    it('should create triangles from vertices when no polygons exist', () => {
      const content = `DYNAMODEL
SURF
V 0.0 0.0 0.0
V 1.0 0.0 0.0
V 0.0 1.0 0.0
V 1.0 1.0 0.0
V 0.5 0.5 1.0
V 1.5 0.5 1.0`
      
      const model = DNMModelParser.parse(content)
      
      // Should create triangles from sequential vertices
      expect(model.polygons).toHaveLength(2) // 6 vertices / 3 = 2 triangles
      expect(model.polygons[0].vertices).toEqual([0, 1, 2])
      expect(model.polygons[1].vertices).toEqual([3, 4, 5])
    })

    it('should limit polygon generation to prevent memory issues', () => {
      // Create a large number of vertices to test the limit
      const vertices = Array.from({ length: 35000 }, (_, i) => 
        `V ${i % 100}.0 ${Math.floor(i / 100)}.0 0.0`
      ).join('\n')
      
      const content = `DYNAMODEL
SURF
${vertices}`

      const model = DNMModelParser.parse(content)
      expect(model.vertices).toHaveLength(35000)
      expect(model.polygons.length).toBeLessThanOrEqual(10000) // Should be limited to 10,000
      expect(model.polygons.length).toBeGreaterThan(0) // Should still create some polygons
    })

    it('should handle performance efficiently with moderate vertex counts', () => {
      // Create 3000 vertices (which should create 1000 triangles)
      const vertices = Array.from({ length: 3000 }, (_, i) => 
        `V ${i % 50}.0 ${Math.floor(i / 50)}.0 0.0`
      ).join('\n')
      
      const content = `DYNAMODEL
SURF
${vertices}`

      const startTime = performance.now()
      const model = DNMModelParser.parse(content)
      const endTime = performance.now()
      
      expect(model.vertices).toHaveLength(3000)
      expect(model.polygons).toHaveLength(1000) // Exactly 3000/3 = 1000 triangles
      expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
    })
  })
})