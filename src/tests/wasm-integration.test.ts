import { describe, it, expect, beforeAll } from 'vitest'
import { loadWasmModule } from '@/utils/wasm-loader'
import type { YSFlightCore } from '@/types/wasm'

describe.skipIf(!globalThis.document)('WASM Integration Tests', () => {
  let wasm: YSFlightCore
  
  beforeAll(async () => {
    try {
      wasm = await loadWasmModule()
    } catch (error) {
      console.warn('Failed to load WASM module in test:', error)
    }
  }, 30000) // Increase timeout to 30 seconds
  
  it('should load WASM module', () => {
    expect(wasm).toBeDefined()
  })
  
  it('should provide version information', () => {
    if (!wasm) {
      expect(wasm).toBeDefined()
      return
    }
    
    const version = wasm.getVersion()
    expect(version).toBe('0.1.0')
    
    const buildInfo = wasm.getBuildInfo()
    expect(buildInfo).toContain('WebFlight WASM Core')
  })
  
  it('should create and use Vector3', () => {
    if (!wasm) {
      expect(wasm).toBeDefined()
      return
    }
    
    const v1 = new wasm.Vector3(1, 2, 3)
    const v2 = new wasm.Vector3(4, 5, 6)
    
    const sum = v1.add(v2)
    expect(sum.x).toBe(5)
    expect(sum.y).toBe(7)
    expect(sum.z).toBe(9)
    
    const length = v1.length()
    expect(length).toBeCloseTo(3.74, 2)
  })
  
  it('should perform math operations', () => {
    if (!wasm) {
      expect(wasm).toBeDefined()
      return
    }
    
    expect(wasm.degToRad(180)).toBeCloseTo(Math.PI, 5)
    expect(wasm.radToDeg(Math.PI)).toBeCloseTo(180, 5)
    expect(wasm.clamp(5, 0, 3)).toBe(3)
    expect(wasm.lerp(0, 10, 0.5)).toBe(5)
  })
  
  it('should use TestModule', () => {
    if (!wasm) {
      expect(wasm).toBeDefined()
      return
    }
    
    const testModule = new wasm.TestModule('test')
    expect(testModule.getName()).toBe('test')
    expect(testModule.getCounter()).toBe(0)
    expect(testModule.incrementCounter()).toBe(1)
    expect(testModule.getCounter()).toBe(1)
    
    const distance = testModule.calculateDistance(0, 0, 0, 3, 4, 0)
    expect(distance).toBe(5)
  })
})