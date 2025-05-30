import { useEffect, useRef } from 'react'

export interface KeyboardState {
  // Primary controls
  throttleUp: boolean
  throttleDown: boolean
  pitchUp: boolean
  pitchDown: boolean
  rollLeft: boolean
  rollRight: boolean
  yawLeft: boolean
  yawRight: boolean
  
  // Additional controls
  brake: boolean
  gear: boolean
  flaps: boolean
  pause: boolean
  
  // Camera controls
  cameraNext: boolean
  cameraPrev: boolean
  
  // Display controls
  hudToggle: boolean
}

export interface KeyMapping {
  throttleUp: string[]
  throttleDown: string[]
  pitchUp: string[]
  pitchDown: string[]
  rollLeft: string[]
  rollRight: string[]
  yawLeft: string[]
  yawRight: string[]
  brake: string[]
  gear: string[]
  flaps: string[]
  pause: string[]
  cameraNext: string[]
  cameraPrev: string[]
  hudToggle: string[]
}

const defaultKeyMapping: KeyMapping = {
  throttleUp: ['PageUp', '=', '+'],
  throttleDown: ['PageDown', '-', '_'],
  pitchUp: ['ArrowDown', 's', 'S'],
  pitchDown: ['ArrowUp', 'w', 'W'],
  rollLeft: ['ArrowLeft', 'a', 'A'],
  rollRight: ['ArrowRight', 'd', 'D'],
  yawLeft: ['q', 'Q', ','],
  yawRight: ['e', 'E', '.'],
  brake: ['b', 'B'],
  gear: ['g', 'G'],
  flaps: ['f', 'F'],
  pause: ['p', 'P', ' '],
  cameraNext: ['c', 'C'],
  cameraPrev: ['v', 'V'],
  hudToggle: ['h', 'H']
}

export function useKeyboardControls(
  enabled: boolean = true,
  customMapping?: Partial<KeyMapping>
): KeyboardState {
  const stateRef = useRef<KeyboardState>({
    throttleUp: false,
    throttleDown: false,
    pitchUp: false,
    pitchDown: false,
    rollLeft: false,
    rollRight: false,
    yawLeft: false,
    yawRight: false,
    brake: false,
    gear: false,
    flaps: false,
    pause: false,
    cameraNext: false,
    cameraPrev: false,
    hudToggle: false
  })
  
  const mapping = { ...defaultKeyMapping, ...customMapping }
  
  useEffect(() => {
    if (!enabled) return
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for arrow keys
      if (event.key.startsWith('Arrow')) {
        event.preventDefault()
      }
      
      const key = event.key
      const state = stateRef.current
      
      // Check each control
      if (mapping.throttleUp.includes(key)) state.throttleUp = true
      if (mapping.throttleDown.includes(key)) state.throttleDown = true
      if (mapping.pitchUp.includes(key)) state.pitchUp = true
      if (mapping.pitchDown.includes(key)) state.pitchDown = true
      if (mapping.rollLeft.includes(key)) state.rollLeft = true
      if (mapping.rollRight.includes(key)) state.rollRight = true
      if (mapping.yawLeft.includes(key)) state.yawLeft = true
      if (mapping.yawRight.includes(key)) state.yawRight = true
      if (mapping.brake.includes(key)) state.brake = true
      if (mapping.gear.includes(key)) state.gear = true
      if (mapping.flaps.includes(key)) state.flaps = true
      if (mapping.pause.includes(key)) state.pause = true
      if (mapping.cameraNext.includes(key)) state.cameraNext = true
      if (mapping.cameraPrev.includes(key)) state.cameraPrev = true
      if (mapping.hudToggle.includes(key)) state.hudToggle = true
    }
    
    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key
      const state = stateRef.current
      
      // Reset states
      if (mapping.throttleUp.includes(key)) state.throttleUp = false
      if (mapping.throttleDown.includes(key)) state.throttleDown = false
      if (mapping.pitchUp.includes(key)) state.pitchUp = false
      if (mapping.pitchDown.includes(key)) state.pitchDown = false
      if (mapping.rollLeft.includes(key)) state.rollLeft = false
      if (mapping.rollRight.includes(key)) state.rollRight = false
      if (mapping.yawLeft.includes(key)) state.yawLeft = false
      if (mapping.yawRight.includes(key)) state.yawRight = false
      if (mapping.brake.includes(key)) state.brake = false
      if (mapping.gear.includes(key)) state.gear = false
      if (mapping.flaps.includes(key)) state.flaps = false
      if (mapping.pause.includes(key)) state.pause = false
      if (mapping.cameraNext.includes(key)) state.cameraNext = false
      if (mapping.cameraPrev.includes(key)) state.cameraPrev = false
      if (mapping.hudToggle.includes(key)) state.hudToggle = false
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [enabled, mapping])
  
  return stateRef.current
}