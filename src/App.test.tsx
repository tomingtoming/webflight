import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

// Mock the WASM loader
vi.mock('./utils/wasm-loader', () => ({
  loadWasmModule: vi.fn().mockResolvedValue({
    getVersion: () => '0.1.0',
    getBuildInfo: () => 'Test Build',
    getSystemInfo: () => ({
      platform: 'web',
      wasmSupported: true,
      threadsSupported: false,
      simdSupported: false,
      memory: {
        heapSize: 16777216,
        stackSize: 65536
      }
    })
  })
}))

describe('App', () => {
  it('renders loading state initially', () => {
    render(<App />)
    expect(screen.getByText('Loading WebFlight...')).toBeInTheDocument()
  })
  
  it('renders app after WASM loads', async () => {
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText('WebFlight')).toBeInTheDocument()
      expect(screen.getByText('✅ WebAssembly Ready')).toBeInTheDocument()
    })
  })
})