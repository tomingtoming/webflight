import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AircraftManager } from './AircraftManager'
import * as THREE from 'three'

// Mock fetch
global.fetch = vi.fn()

describe('AircraftManager', () => {
  let manager: AircraftManager

  beforeEach(() => {
    manager = new AircraftManager('/test/aircraft/')
    vi.clearAllMocks()
  })

  afterEach(() => {
    manager.clearCache()
  })

  describe('loadAircraft', () => {
    it('should load aircraft with all files', async () => {
      const mockDataContent = `IDENTIFY "F-16 FIGHTING FALCON"
CATEGORY JET
SUBSTNAM "F-16C"
ENGINE JET 1
WEIGFUEL 3175kg
WEIGHCLN 8570kg
WINGSQUR 27.87m^2
CRITAOAP 22deg
CRITAOAM -15deg`

      const mockModelContent = `DYNAMODEL
SURF
V 0.0 0.0 0.0
V 10.0 0.0 0.0
V 5.0 5.0 0.0
C 128 128 128
B
0
1
2
E`

      const mockFetch = vi.mocked(global.fetch)
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: async () => mockDataContent
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          text: async () => mockModelContent
        } as Response)

      const asset = await manager.loadAircraft('f16', {
        dataFile: 'f16.dat',
        modelFile: 'f16.dnm'
      })

      expect(asset).toBeDefined()
      expect(asset.id).toBe('f16')
      expect(asset.data).toBeDefined()
      expect(asset.data.identify).toBe('F-16 FIGHTING FALCON')
      expect(asset.geometry).toBeInstanceOf(THREE.BufferGeometry)
      expect(asset.material).toBeInstanceOf(THREE.MeshStandardMaterial)

      // Check fetch calls
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch).toHaveBeenCalledWith('/test/aircraft/f16.dat')
      expect(mockFetch).toHaveBeenCalledWith('/test/aircraft/f16.dnm')
    })

    it('should cache loaded aircraft', async () => {
      const mockFetch = vi.mocked(global.fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => 'DYNAMODEL\n'
      } as Response)

      const definition = {
        dataFile: 'test.dat',
        modelFile: 'test.dnm'
      }

      const asset1 = await manager.loadAircraft('test', definition)
      const asset2 = await manager.loadAircraft('test', definition)

      expect(asset1).toBe(asset2) // Same instance
      expect(mockFetch).toHaveBeenCalledTimes(2) // Only 2 calls for first load
    })

    it('should handle loading errors gracefully', async () => {
      const mockFetch = vi.mocked(global.fetch)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      } as Response)

      await expect(
        manager.loadAircraft('missing', {
          dataFile: 'missing.dat',
          modelFile: 'missing.dnm'
        })
      ).rejects.toThrow('Failed to load missing.dat: Not Found')
    })

    it('should load optional files when provided', async () => {
      const mockFetch = vi.mocked(global.fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => 'DYNAMODEL\n'
      } as Response)

      const asset = await manager.loadAircraft('full', {
        dataFile: 'full.dat',
        modelFile: 'full.dnm',
        collisionFile: 'fullcoll.srf',
        cockpitFile: 'fullcockpit.srf',
        lodFile: 'full_coarse.dnm'
      })

      expect(mockFetch).toHaveBeenCalledTimes(5)
      expect(asset.collisionGeometry).toBeDefined()
      expect(asset.cockpitGeometry).toBeDefined()
      expect(asset.lodGeometry).toBeDefined()
    })
  })

  describe('createAircraftMesh', () => {
    it('should create mesh with proper coordinate transformation', async () => {
      const mockFetch = vi.mocked(global.fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => `DYNAMODEL
SURF
V 0.0 0.0 10.0
V 5.0 0.0 10.0
V 2.5 5.0 10.0
C 255 0 0
B
0
1
2
E`
      } as Response)

      const asset = await manager.loadAircraft('test', {
        dataFile: 'test.dat',
        modelFile: 'test.dnm'
      })

      const mesh = manager.createAircraftMesh(asset)

      expect(mesh).toBeInstanceOf(THREE.Mesh)
      expect(mesh.castShadow).toBe(true)
      expect(mesh.receiveShadow).toBe(true)

      // Check Z coordinate negation
      const positions = (mesh.geometry as THREE.BufferGeometry).attributes.position.array
      expect(positions[2]).toBe(-10.0) // Z negated
      expect(positions[5]).toBe(-10.0)
      expect(positions[8]).toBe(-10.0)
    })

    it('should create fallback mesh when no vertices', async () => {
      const mockFetch = vi.mocked(global.fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => 'DYNAMODEL\n'
      } as Response)

      const asset = await manager.loadAircraft('empty', {
        dataFile: 'empty.dat',
        modelFile: 'empty.dnm'
      })

      const mesh = manager.createAircraftMesh(asset)

      expect(mesh).toBeInstanceOf(THREE.Mesh)
      expect(mesh.geometry).toBeInstanceOf(THREE.ConeGeometry)
      expect(mesh.children).toHaveLength(2) // Wings and tail
    })

    it('should scale aircraft based on type', async () => {
      const mockFetch = vi.mocked(global.fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => `DYNAMODEL
SURF
V -50.0 0.0 -50.0
V 50.0 0.0 -50.0
V 0.0 10.0 50.0
C 128 128 128
B
0
1
2
E`
      } as Response)

      // Test cessna (small aircraft)
      const cessnaAsset = await manager.loadAircraft('cessna172', {
        dataFile: 'cessna172.dat',
        modelFile: 'cessna172.dnm'
      })
      const cessnaMesh = manager.createAircraftMesh(cessnaAsset)
      const cessnaScale = cessnaMesh.scale.x

      // Test B747 (large aircraft)
      const b747Asset = await manager.loadAircraft('b747', {
        dataFile: 'b747.dat',
        modelFile: 'b747.dnm'
      })
      const b747Mesh = manager.createAircraftMesh(b747Asset)
      const b747Scale = b747Mesh.scale.x

      // B747 should be scaled larger than Cessna
      expect(b747Scale).toBeGreaterThan(cessnaScale)
    })
  })

  describe('loadAircraftList', () => {
    it('should parse aircraft.lst correctly', async () => {
      const mockListContent = `aircraft/f16.dat aircraft/f16.dnm aircraft/f16coll.srf aircraft/f16cockpit.srf aircraft/f16_coarse.dnm

aircraft/cessna172r.dat aircraft/cessna172r.dnm aircraft/cessna172_collision.srf aircraft/cessna172_cockpit.srf

# This is a comment
aircraft/b747.dat aircraft/b747.dnm aircraft/b747coll.srf aircraft/b747cockpit.srf aircraft/b747coarse.dnm`

      const mockFetch = vi.mocked(global.fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockListContent
      } as Response)

      const list = await manager.loadAircraftList()

      expect(list).toHaveLength(3)
      expect(list[0]).toEqual({
        id: 'f16',
        name: 'F-16 Fighting Falcon',
        definition: {
          dataFile: 'f16.dat',
          modelFile: 'f16.dnm',
          collisionFile: 'f16coll.srf',
          cockpitFile: 'f16cockpit.srf',
          lodFile: 'f16_coarse.dnm'
        }
      })
      expect(list[1].id).toBe('cessna172r')
      expect(list[1].name).toBe('Cessna 172R')
      expect(list[2].id).toBe('b747')
      expect(list[2].name).toBe('Boeing 747')
    })
  })

  describe('loadAllAircraft', () => {
    it('should load aircraft in batches', async () => {
      const mockListContent = `aircraft/a1.dat aircraft/a1.dnm
aircraft/a2.dat aircraft/a2.dnm
aircraft/a3.dat aircraft/a3.dnm
aircraft/a4.dat aircraft/a4.dnm
aircraft/a5.dat aircraft/a5.dnm
aircraft/a6.dat aircraft/a6.dnm`

      const mockFetch = vi.mocked(global.fetch)
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: async () => mockListContent
        } as Response)
        .mockResolvedValue({
          ok: true,
          text: async () => 'DYNAMODEL\n'
        } as Response)

      await manager.loadAllAircraft()

      // Should load in batches of 5
      const allAircraft = manager.getAllAircraft()
      expect(allAircraft.length).toBeLessThanOrEqual(6)
    })
  })

  describe('memory management', () => {
    it('should dispose geometries and materials when clearing cache', async () => {
      const mockFetch = vi.mocked(global.fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => `DYNAMODEL
SURF
V 0 0 0
V 1 0 0
V 0 1 0
C 255 0 0
B
0
1
2
E`
      } as Response)

      const asset = await manager.loadAircraft('test', {
        dataFile: 'test.dat',
        modelFile: 'test.dnm'
      })

      const disposeSpy = vi.spyOn(asset.geometry, 'dispose')
      const materialDisposeSpy = vi.spyOn(asset.material, 'dispose')

      manager.clearCache()

      expect(disposeSpy).toHaveBeenCalled()
      expect(materialDisposeSpy).toHaveBeenCalled()
      expect(manager.getAllAircraft()).toHaveLength(0)
    })
  })
})