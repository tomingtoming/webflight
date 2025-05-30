// Type definitions for Three.js examples
declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, MOUSE, Vector3 } from 'three'
  
  export class OrbitControls {
    constructor(object: Camera, domElement?: HTMLElement)
    
    object: Camera
    domElement: HTMLElement | Document
    
    // API
    enabled: boolean
    target: Vector3
    
    minDistance: number
    maxDistance: number
    
    minPolarAngle: number
    maxPolarAngle: number
    
    minAzimuthAngle: number
    maxAzimuthAngle: number
    
    enableDamping: boolean
    dampingFactor: number
    
    enableZoom: boolean
    zoomSpeed: number
    
    enableRotate: boolean
    rotateSpeed: number
    
    enablePan: boolean
    panSpeed: number
    screenSpacePanning: boolean
    keyPanSpeed: number
    
    autoRotate: boolean
    autoRotateSpeed: number
    
    enableKeys: boolean
    keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string }
    mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE }
    
    update(): boolean
    
    saveState(): void
    reset(): void
    
    dispose(): void
    
    getPolarAngle(): number
    getAzimuthalAngle(): number
    
    listenToKeyEvents(domElement: HTMLElement): void
    stopListenToKeyEvents(): void
  }
}

declare module 'three/examples/jsm/postprocessing/EffectComposer' {
  import { WebGLRenderer, WebGLRenderTarget } from 'three'
  import { Pass } from 'three/examples/jsm/postprocessing/Pass'
  
  export class EffectComposer {
    constructor(renderer: WebGLRenderer, renderTarget?: WebGLRenderTarget)
    
    renderer: WebGLRenderer
    renderTarget1: WebGLRenderTarget
    renderTarget2: WebGLRenderTarget
    writeBuffer: WebGLRenderTarget
    readBuffer: WebGLRenderTarget
    passes: Pass[]
    copyPass: Pass
    
    swapBuffers(): void
    addPass(pass: Pass): void
    insertPass(pass: Pass, index: number): void
    removePass(pass: Pass): void
    isLastEnabledPass(passIndex: number): boolean
    render(deltaTime?: number): void
    reset(renderTarget?: WebGLRenderTarget): void
    setSize(width: number, height: number): void
    setPixelRatio(pixelRatio: number): void
    dispose(): void
  }
}

declare module 'three/examples/jsm/postprocessing/RenderPass' {
  import { Scene, Camera, Material, Color } from 'three'
  import { Pass } from 'three/examples/jsm/postprocessing/Pass'
  
  export class RenderPass extends Pass {
    constructor(scene: Scene, camera: Camera, overrideMaterial?: Material, clearColor?: Color, clearAlpha?: number)
    
    scene: Scene
    camera: Camera
    overrideMaterial?: Material
    clearColor?: Color
    clearAlpha: number
    clear: boolean
    clearDepth: boolean
    needsSwap: boolean
  }
}

declare module 'three/examples/jsm/postprocessing/SMAAPass' {
  import { Pass } from 'three/examples/jsm/postprocessing/Pass'
  
  export class SMAAPass extends Pass {
    constructor(width: number, height: number)
  }
}

declare module 'three/examples/jsm/postprocessing/Pass' {
  import { WebGLRenderer, WebGLRenderTarget } from 'three'
  
  export class Pass {
    constructor()
    
    enabled: boolean
    needsSwap: boolean
    clear: boolean
    renderToScreen: boolean
    
    setSize(width: number, height: number): void
    render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget, deltaTime?: number, maskActive?: boolean): void
    dispose(): void
  }
}