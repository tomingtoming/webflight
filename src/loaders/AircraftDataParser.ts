export interface AircraftData {
  // Identification
  identify: string
  category: string
  
  // Engine properties
  hasAfterburner: boolean
  thrustAfterburner: number // in kg
  thrustMilitary: number // in kg
  fuelConsumptionAfterburner: number // kg/s
  fuelConsumptionMilitary: number // kg/s
  
  // Weight properties
  weightClean: number // in kg
  weightFuel: number // in kg
  weightPayload: number // in kg
  
  // Aerodynamic properties
  wingArea: number // in m²
  criticalAOAPositive: number // in radians
  criticalAOANegative: number // in radians
  criticalSpeed: number // Mach
  maxSpeed: number // Mach
  
  // Control surfaces effects
  flapLiftCoefficient: number
  flapDragCoefficient: number
  gearDragCoefficient: number
  spoilerDragCoefficient: number
  
  // Positions
  cockpitPosition: { x: number; y: number; z: number }
  leftGearPosition: { x: number; y: number; z: number }
  rightGearPosition: { x: number; y: number; z: number }
  wheelGearPosition: { x: number; y: number; z: number }
  
  // Features
  hasSpoiler: boolean
  hasRetractableGear: boolean
  hasVariableGeometryWing: boolean
  
  // Maneuverability
  minManeuverableSpeed: number // in m/s
  fullyManeuverableSpeed: number // in m/s
  pitchManeuverability: number
  pitchStability: number
  yawManeuverability: number
  yawStability: number
  rollManeuverability: number
  
  // Weapon hardpoints
  hardpoints: Array<{
    position: { x: number; y: number; z: number }
    allowedWeapons: string[]
  }>
  
  // Other properties
  strength: number
  outsideRadius: number
}

export class AircraftDataParser {
  static parse(content: string): AircraftData {
    const lines = content.split('\n').map(line => line.trim())
    const data: Partial<AircraftData> = {
      hardpoints: []
    }
    
    for (const line of lines) {
      if (!line || line.startsWith('REM') || line.startsWith('#')) continue
      
      const commentIndex = line.indexOf('#')
      const cleanLine = commentIndex >= 0 ? line.substring(0, commentIndex).trim() : line
      
      const parts = cleanLine.split(/\s+/)
      if (parts.length < 2) continue
      
      const command = parts[0]
      const value = parts.slice(1).join(' ')
      
      switch (command) {
        case 'IDENTIFY':
          data.identify = value.replace(/"/g, '')
          break
          
        case 'CATEGORY':
          data.category = value
          break
          
        case 'AFTBURNR':
          data.hasAfterburner = value === 'TRUE'
          break
          
        case 'THRAFTBN':
          data.thrustAfterburner = this.parseWeight(value)
          break
          
        case 'THRMILIT':
          data.thrustMilitary = this.parseWeight(value)
          break
          
        case 'WEIGHCLN':
          data.weightClean = this.parseWeight(value)
          break
          
        case 'WEIGFUEL':
          data.weightFuel = this.parseWeight(value)
          break
          
        case 'WEIGLOAD':
          data.weightPayload = this.parseWeight(value)
          break
          
        case 'FUELABRN':
          data.fuelConsumptionAfterburner = this.parseWeight(value) / 1000 // Convert to kg/s
          break
          
        case 'FUELMILI':
          data.fuelConsumptionMilitary = this.parseWeight(value) / 1000 // Convert to kg/s
          break
          
        case 'COCKPITP':
          data.cockpitPosition = this.parsePosition(parts.slice(1, 4))
          break
          
        case 'LEFTGEAR':
          data.leftGearPosition = this.parsePosition(parts.slice(1, 4))
          break
          
        case 'RIGHGEAR':
          data.rightGearPosition = this.parsePosition(parts.slice(1, 4))
          break
          
        case 'WHELGEAR':
          data.wheelGearPosition = this.parsePosition(parts.slice(1, 4))
          break
          
        case 'STRENGTH':
          data.strength = parseFloat(value)
          break
          
        case 'CRITAOAP':
          data.criticalAOAPositive = this.parseAngle(value)
          break
          
        case 'CRITAOAM':
          data.criticalAOANegative = this.parseAngle(value)
          break
          
        case 'CRITSPED':
          data.criticalSpeed = this.parseMach(value)
          break
          
        case 'MAXSPEED':
          data.maxSpeed = this.parseMach(value)
          break
          
        case 'HASSPOIL':
          data.hasSpoiler = value === 'TRUE'
          break
          
        case 'RETRGEAR':
          data.hasRetractableGear = value === 'TRUE'
          break
          
        case 'VARGEOMW':
          data.hasVariableGeometryWing = value === 'TRUE'
          break
          
        case 'CLBYFLAP':
          data.flapLiftCoefficient = parseFloat(value)
          break
          
        case 'CDBYFLAP':
          data.flapDragCoefficient = parseFloat(value)
          break
          
        case 'CDBYGEAR':
          data.gearDragCoefficient = parseFloat(value)
          break
          
        case 'CDSPOILR':
          data.spoilerDragCoefficient = parseFloat(value)
          break
          
        case 'WINGAREA':
          data.wingArea = this.parseArea(value)
          break
          
        case 'MANESPD1':
          data.minManeuverableSpeed = this.parseSpeed(value)
          break
          
        case 'MANESPD2':
          data.fullyManeuverableSpeed = this.parseSpeed(value)
          break
          
        case 'CPITMANE':
          data.pitchManeuverability = parseFloat(value)
          break
          
        case 'CPITSTAB':
          data.pitchStability = parseFloat(value)
          break
          
        case 'CYAWMANE':
          data.yawManeuverability = parseFloat(value)
          break
          
        case 'CYAWSTAB':
          data.yawStability = parseFloat(value)
          break
          
        case 'CROLLMAN':
          data.rollManeuverability = parseFloat(value)
          break
          
        case 'HTRADIUS':
          data.outsideRadius = this.parseDistance(value)
          break
          
        case 'HRDPOINT':
          const hardpoint = {
            position: this.parsePosition(parts.slice(1, 4)),
            allowedWeapons: parts.slice(4)
          }
          data.hardpoints!.push(hardpoint)
          break
      }
    }
    
    return data as AircraftData
  }
  
  private static parseWeight(value: string): number {
    value = value.toLowerCase()
    if (value.endsWith('t')) {
      return parseFloat(value) * 1000 // tons to kg
    } else if (value.endsWith('kg')) {
      return parseFloat(value)
    }
    return parseFloat(value)
  }
  
  private static parseDistance(value: string): number {
    value = value.toLowerCase()
    if (value.endsWith('m')) {
      return parseFloat(value)
    } else if (value.endsWith('ft')) {
      return parseFloat(value) * 0.3048 // feet to meters
    }
    return parseFloat(value)
  }
  
  private static parsePosition(parts: string[]): { x: number; y: number; z: number } {
    return {
      x: this.parseDistance(parts[0]),
      y: this.parseDistance(parts[1]),
      z: this.parseDistance(parts[2])
    }
  }
  
  private static parseAngle(value: string): number {
    value = value.toLowerCase()
    if (value.endsWith('deg')) {
      return parseFloat(value) * Math.PI / 180 // degrees to radians
    } else if (value.endsWith('rad')) {
      return parseFloat(value)
    }
    return parseFloat(value) * Math.PI / 180 // assume degrees
  }
  
  private static parseMach(value: string): number {
    value = value.toLowerCase()
    if (value.endsWith('mach')) {
      return parseFloat(value)
    }
    return parseFloat(value)
  }
  
  private static parseSpeed(value: string): number {
    value = value.toLowerCase()
    if (value.endsWith('kt')) {
      return parseFloat(value) * 0.514444 // knots to m/s
    } else if (value.endsWith('m/s')) {
      return parseFloat(value)
    } else if (value.endsWith('mph')) {
      return parseFloat(value) * 0.44704 // mph to m/s
    }
    return parseFloat(value)
  }
  
  private static parseArea(value: string): number {
    value = value.toLowerCase()
    if (value.endsWith('m^2')) {
      return parseFloat(value)
    } else if (value.endsWith('ft^2')) {
      return parseFloat(value) * 0.092903 // ft² to m²
    }
    return parseFloat(value)
  }
}