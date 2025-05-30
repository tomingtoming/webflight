import { useEffect, useRef } from 'react'
import type { AircraftState } from '@/types/wasm'
import './HUD.css'

interface HUDProps {
  aircraftState: AircraftState | null
  isEnabled: boolean
}

export function HUD({ aircraftState, isEnabled }: HUDProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    if (!canvasRef.current || !aircraftState || !isEnabled) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // HUD styling
    ctx.strokeStyle = '#00ff00'
    ctx.fillStyle = '#00ff00'
    ctx.lineWidth = 2
    ctx.font = '16px monospace'
    ctx.textAlign = 'left'
    
    const centerX = canvas.offsetWidth / 2
    const centerY = canvas.offsetHeight / 2
    
    // Draw artificial horizon
    drawArtificialHorizon(ctx, centerX, centerY, aircraftState.pitch, aircraftState.roll)
    
    // Draw flight path vector
    drawFlightPathVector(ctx, centerX, centerY, aircraftState)
    
    // Draw altitude ladder
    drawAltitudeLadder(ctx, canvas.offsetWidth - 100, centerY, aircraftState.altitude)
    
    // Draw speed indicator
    drawSpeedIndicator(ctx, 100, centerY, aircraftState.airspeed)
    
    // Draw heading indicator
    drawHeadingIndicator(ctx, centerX, 60, aircraftState.heading)
    
    // Draw status info
    drawStatusInfo(ctx, canvas.offsetWidth, canvas.offsetHeight, aircraftState)
    
  }, [aircraftState, isEnabled])
  
  if (!isEnabled || !aircraftState) return null
  
  return (
    <canvas 
      ref={canvasRef} 
      className="hud-canvas"
    />
  )
}

function drawArtificialHorizon(
  ctx: CanvasRenderingContext2D, 
  centerX: number, 
  centerY: number, 
  pitch: number, 
  roll: number
) {
  ctx.save()
  
  // Translate to center and rotate by roll
  ctx.translate(centerX, centerY)
  ctx.rotate(-roll)
  
  // Calculate pitch offset (pixels per degree)
  const pixelsPerDegree = 3
  const pitchOffset = pitch * pixelsPerDegree * (180 / Math.PI)
  
  // Draw horizon line
  ctx.beginPath()
  ctx.moveTo(-150, pitchOffset)
  ctx.lineTo(150, pitchOffset)
  ctx.stroke()
  
  // Draw pitch ladder
  for (let angle = -30; angle <= 30; angle += 10) {
    if (angle === 0) continue
    
    const y = pitchOffset + (angle * pixelsPerDegree)
    const width = angle % 20 === 0 ? 40 : 20
    
    ctx.beginPath()
    ctx.moveTo(-width, y)
    ctx.lineTo(width, y)
    ctx.stroke()
    
    // Draw angle text
    if (angle % 20 === 0) {
      ctx.save()
      ctx.rotate(roll)
      ctx.fillText(Math.abs(angle).toString(), width + 10, y + 5)
      ctx.fillText(Math.abs(angle).toString(), -width - 25, y + 5)
      ctx.restore()
    }
  }
  
  ctx.restore()
  
  // Draw aircraft reference symbol
  ctx.beginPath()
  ctx.moveTo(centerX - 60, centerY)
  ctx.lineTo(centerX - 20, centerY)
  ctx.moveTo(centerX + 20, centerY)
  ctx.lineTo(centerX + 60, centerY)
  ctx.moveTo(centerX, centerY - 10)
  ctx.lineTo(centerX, centerY + 10)
  ctx.stroke()
}

function drawFlightPathVector(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  state: AircraftState
) {
  // Calculate flight path angle
  const velocityMagnitude = Math.sqrt(
    state.velocity.x ** 2 + 
    state.velocity.y ** 2 + 
    state.velocity.z ** 2
  )
  
  if (velocityMagnitude < 1) return
  
  const flightPathAngle = Math.asin(state.velocity.y / velocityMagnitude)
  const pixelsPerDegree = 3
  const fpvY = centerY - (flightPathAngle * pixelsPerDegree * (180 / Math.PI))
  
  // Draw flight path vector symbol
  ctx.beginPath()
  ctx.arc(centerX, fpvY, 15, 0, Math.PI * 2)
  ctx.moveTo(centerX - 25, fpvY)
  ctx.lineTo(centerX - 15, fpvY)
  ctx.moveTo(centerX + 15, fpvY)
  ctx.lineTo(centerX + 25, fpvY)
  ctx.moveTo(centerX, fpvY - 25)
  ctx.lineTo(centerX, fpvY - 15)
  ctx.stroke()
}

function drawAltitudeLadder(
  ctx: CanvasRenderingContext2D,
  x: number,
  centerY: number,
  altitude: number
) {
  ctx.save()
  ctx.textAlign = 'right'
  
  // Draw altitude box
  ctx.strokeRect(x - 80, centerY - 20, 75, 40)
  ctx.fillStyle = 'black'
  ctx.fillRect(x - 79, centerY - 19, 73, 38)
  ctx.fillStyle = '#00ff00'
  ctx.font = '18px monospace'
  ctx.fillText(Math.round(altitude).toString(), x - 10, centerY + 6)
  
  // Draw altitude tape
  ctx.font = '14px monospace'
  const altInterval = 100
  const pixelsPerMeter = 0.5
  
  for (let i = -5; i <= 5; i++) {
    const refAlt = Math.floor(altitude / altInterval) * altInterval + (i * altInterval)
    const y = centerY - ((refAlt - altitude) * pixelsPerMeter)
    
    if (Math.abs(y - centerY) > 150) continue
    
    ctx.beginPath()
    ctx.moveTo(x - 80, y)
    ctx.lineTo(x - 90, y)
    ctx.stroke()
    
    if (refAlt % 500 === 0) {
      ctx.fillText(refAlt.toString(), x - 95, y + 5)
    }
  }
  
  ctx.restore()
}

function drawSpeedIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  centerY: number,
  airspeed: number
) {
  ctx.save()
  
  // Draw speed box
  ctx.strokeRect(x + 5, centerY - 20, 75, 40)
  ctx.fillStyle = 'black'
  ctx.fillRect(x + 6, centerY - 19, 73, 38)
  ctx.fillStyle = '#00ff00'
  ctx.font = '18px monospace'
  ctx.fillText(Math.round(airspeed).toString(), x + 10, centerY + 6)
  
  // Draw speed tape
  ctx.font = '14px monospace'
  const speedInterval = 10
  const pixelsPerMps = 2
  
  for (let i = -5; i <= 5; i++) {
    const refSpeed = Math.floor(airspeed / speedInterval) * speedInterval + (i * speedInterval)
    const y = centerY - ((refSpeed - airspeed) * pixelsPerMps)
    
    if (Math.abs(y - centerY) > 150 || refSpeed < 0) continue
    
    ctx.beginPath()
    ctx.moveTo(x + 80, y)
    ctx.lineTo(x + 90, y)
    ctx.stroke()
    
    if (refSpeed % 50 === 0) {
      ctx.fillText(refSpeed.toString(), x + 95, y + 5)
    }
  }
  
  ctx.restore()
}

function drawHeadingIndicator(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  heading: number
) {
  ctx.save()
  
  const headingDeg = heading * (180 / Math.PI)
  const compassWidth = 300
  
  // Draw compass tape
  ctx.beginPath()
  ctx.moveTo(centerX - compassWidth/2, y)
  ctx.lineTo(centerX + compassWidth/2, y)
  ctx.stroke()
  
  // Draw heading marks
  ctx.textAlign = 'center'
  ctx.font = '14px monospace'
  
  for (let deg = -180; deg <= 180; deg += 10) {
    const displayHeading = ((headingDeg + deg + 360) % 360)
    const x = centerX + (deg * 2)
    
    if (Math.abs(x - centerX) > compassWidth/2) continue
    
    ctx.beginPath()
    ctx.moveTo(x, y)
    
    if (displayHeading % 30 === 0) {
      ctx.lineTo(x, y - 15)
      ctx.stroke()
      
      const headingText = displayHeading === 0 ? 'N' :
                         displayHeading === 90 ? 'E' :
                         displayHeading === 180 ? 'S' :
                         displayHeading === 270 ? 'W' :
                         (displayHeading / 10).toFixed(0)
      
      ctx.fillText(headingText, x, y - 20)
    } else {
      ctx.lineTo(x, y - 8)
      ctx.stroke()
    }
  }
  
  // Draw current heading box
  ctx.strokeRect(centerX - 30, y - 45, 60, 25)
  ctx.fillStyle = 'black'
  ctx.fillRect(centerX - 29, y - 44, 58, 23)
  ctx.fillStyle = '#00ff00'
  ctx.font = '16px monospace'
  ctx.fillText(Math.round((headingDeg + 360) % 360).toString().padStart(3, '0'), centerX, y - 26)
  
  // Draw heading indicator
  ctx.beginPath()
  ctx.moveTo(centerX - 5, y - 18)
  ctx.lineTo(centerX, y - 8)
  ctx.lineTo(centerX + 5, y - 18)
  ctx.stroke()
  
  ctx.restore()
}

function drawStatusInfo(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: AircraftState
) {
  ctx.save()
  ctx.font = '14px monospace'
  ctx.textAlign = 'left'
  
  const leftMargin = 20
  const bottomMargin = height - 100
  const lineHeight = 20
  
  // G-force calculation (simplified)
  const gForce = 1 + (state.pitchRate * state.airspeed / 9.81)
  
  // Vertical speed in m/s
  const verticalSpeed = state.velocity.y
  
  const statusLines = [
    `THR: ${(state.throttle * 100).toFixed(0)}%`,
    `VS: ${verticalSpeed > 0 ? '+' : ''}${verticalSpeed.toFixed(1)} m/s`,
    `G: ${gForce.toFixed(1)}`,
    `FUEL: ${state.fuel.toFixed(0)} kg`
  ]
  
  statusLines.forEach((line, index) => {
    ctx.fillText(line, leftMargin, bottomMargin + (index * lineHeight))
  })
  
  // Draw angle of attack indicator (simplified)
  ctx.textAlign = 'right'
  const aoa = Math.atan2(state.velocity.y, Math.sqrt(state.velocity.x ** 2 + state.velocity.z ** 2)) * (180 / Math.PI)
  ctx.fillText(`AOA: ${aoa.toFixed(1)}°`, width - leftMargin, bottomMargin)
  
  ctx.restore()
}