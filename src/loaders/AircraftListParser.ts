import { AircraftDefinition } from '@/managers/AircraftManager'

export interface AircraftListEntry {
  id: string
  name: string
  definition: AircraftDefinition
}

export class AircraftListParser {
  static parse(content: string): AircraftListEntry[] {
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'))
    const entries: AircraftListEntry[] = []
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      if (parts.length < 2) continue
      
      // Extract file paths
      const dataFile = parts[0]
      const modelFile = parts[1]
      const collisionFile = parts[2]
      const cockpitFile = parts[3]
      const lodFile = parts[4]
      
      // Extract ID from the data file name
      const dataFileName = dataFile.split('/').pop()!
      const id = dataFileName.replace('.dat', '')
      
      // Generate a display name from the ID
      const name = this.generateDisplayName(id)
      
      // Remove 'aircraft/' prefix from paths
      const definition: AircraftDefinition = {
        dataFile: dataFile.replace('aircraft/', ''),
        modelFile: modelFile.replace('aircraft/', ''),
        collisionFile: collisionFile ? collisionFile.replace('aircraft/', '') : undefined,
        cockpitFile: cockpitFile ? cockpitFile.replace('aircraft/', '') : undefined,
        lodFile: lodFile ? lodFile.replace('aircraft/', '') : undefined
      }
      
      entries.push({ id, name, definition })
    }
    
    return entries
  }
  
  private static generateDisplayName(id: string): string {
    // Special cases for known aircraft
    const specialNames: { [key: string]: string } = {
      'a4': 'A-4 Skyhawk',
      'a6': 'A-6 Intruder',
      'a6m5': 'A6M5 Zero',
      'a10': 'A-10 Thunderbolt II',
      'ah1': 'AH-1 Cobra',
      'ah64': 'AH-64 Apache',
      'a300': 'Airbus A300',
      'a320': 'Airbus A320',
      'alphajet': 'Alpha Jet',
      'amx': 'AMX',
      'av8b': 'AV-8B Harrier II',
      'b2': 'B-2 Spirit',
      'b29': 'B-29 Superfortress',
      'b52': 'B-52 Stratofortress',
      'b737': 'Boeing 737',
      'b747': 'Boeing 747',
      'b767': 'Boeing 767',
      'b777': 'Boeing 777',
      'cessna172r': 'Cessna 172R',
      'c130': 'C-130 Hercules',
      'concorde': 'Concorde',
      'draken': 'Saab 35 Draken',
      'ea6b': 'EA-6B Prowler',
      'eclipse': 'Eclipse 500',
      'eurofighter': 'Eurofighter Typhoon',
      'e2c': 'E-2C Hawkeye',
      'f1': 'Mitsubishi F-1',
      'f2': 'Mitsubishi F-2',
      'f4e': 'F-4E Phantom II',
      'f4ej': 'F-4EJ Phantom II',
      'f5': 'F-5 Tiger II',
      'f14': 'F-14 Tomcat',
      'f15': 'F-15 Eagle',
      'f15d': 'F-15D Eagle',
      'f15j': 'F-15J Eagle',
      'f15dj': 'F-15DJ Eagle',
      'f15dj_madara': 'F-15DJ (Madara)',
      'f15dj_chairo': 'F-15DJ (Chairo)',
      'f15dj_kuro': 'F-15DJ (Kuro)',
      'f15dj_midori': 'F-15DJ (Midori)',
      'f15dj_nakaao': 'F-15DJ (Nakaao)',
      'f15dj_sotoao': 'F-15DJ (Sotoao)',
      'f15dj_sotomidori': 'F-15DJ (Sotomidori)',
      'f16': 'F-16 Fighting Falcon',
      'thunder': 'Thunderbirds F-16',
      'f18': 'F/A-18 Hornet',
      'f18e': 'F/A-18E Super Hornet',
      'angels': 'Blue Angels F/A-18',
      'f22': 'F-22 Raptor',
      'f86blue': 'F-86 Sabre (Blue)',
      'f100d': 'F-100D Super Sabre',
      'f104': 'F-104 Starfighter',
      'f117a': 'F-117A Nighthawk',
      'fw190': 'Fw 190',
      'gripen': 'JAS 39 Gripen',
      'g4m': 'G4M Betty',
      'hawk': 'BAE Hawk',
      'hurricane': 'Hawker Hurricane',
      'redarrows': 'Red Arrows Hawk',
      'kfir': 'IAI Kfir',
      'lancaster': 'Avro Lancaster',
      'mu2': 'Mitsubishi MU-2',
      'mig15': 'MiG-15',
      'mig21': 'MiG-21',
      'mig23': 'MiG-23',
      'mig29': 'MiG-29',
      'mrg2000': 'Mirage 2000',
      'p51': 'P-51 Mustang',
      'archer': 'Piper Archer',
      'rafale': 'Dassault Rafale',
      's3': 'S-3 Viking',
      'spitfire': 'Supermarine Spitfire',
      'su22': 'Su-22',
      'su24': 'Su-24',
      'su25': 'Su-25',
      'su27': 'Su-27',
      't2blue': 'T-2 Blue Impulse',
      't4blue': 'T-4 Blue Impulse',
      't400': 'Beechcraft T-400',
      'tornado': 'Panavia Tornado',
      'tu160': 'Tu-160 Blackjack',
      'u125': 'U-125',
      'u125a': 'U-125A',
      'uh60': 'UH-60 Black Hawk',
      'uh60j': 'UH-60J',
      'v107': 'V-107 Sea Knight',
      'viggen': 'Saab 37 Viggen',
      'ys11': 'YS-11'
    }
    
    // Return special name if exists, otherwise generate from ID
    if (specialNames[id]) {
      return specialNames[id]
    }
    
    // Convert ID to display name (e.g., "f16" -> "F16")
    return id.toUpperCase().replace(/_/g, ' ')
  }
  
  // Load and parse aircraft.lst from a URL
  static async loadFromUrl(url: string): Promise<AircraftListEntry[]> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load aircraft list: ${response.statusText}`)
    }
    const content = await response.text()
    return this.parse(content)
  }
}