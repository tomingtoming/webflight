import { useState, useEffect } from 'react'
import { AircraftManager, AircraftDefinition } from '@/managers/AircraftManager'
import './AircraftSelector.css'

interface AircraftSelectorProps {
  onAircraftSelected: (aircraftId: string) => void
  aircraftManager: AircraftManager
}

const availableAircraft: Array<{ id: string; name: string; definition: AircraftDefinition }> = [
  {
    id: 'f16',
    name: 'F-16 Fighting Falcon',
    definition: {
      dataFile: 'f16.dat',
      modelFile: 'f16.dnm'
    }
  },
  {
    id: 'cessna172',
    name: 'Cessna 172',
    definition: {
      dataFile: 'cessna172r.dat',
      modelFile: 'cessna172r.dnm'
    }
  }
]

export function AircraftSelector({ onAircraftSelected, aircraftManager }: AircraftSelectorProps) {
  const [selectedAircraft, setSelectedAircraft] = useState('f16')
  const [loading, setLoading] = useState(false)
  const [loadedAircraft, setLoadedAircraft] = useState<Set<string>>(new Set())
  
  const handleSelectAircraft = async (aircraftId: string) => {
    setSelectedAircraft(aircraftId)
    setLoading(true)
    
    try {
      const aircraft = availableAircraft.find(a => a.id === aircraftId)
      if (!aircraft) return
      
      // Load aircraft if not already loaded
      if (!loadedAircraft.has(aircraftId)) {
        await aircraftManager.loadAircraft(aircraftId, aircraft.definition)
        setLoadedAircraft(prev => new Set([...prev, aircraftId]))
      }
      
      onAircraftSelected(aircraftId)
    } catch (error) {
      console.error('Failed to load aircraft:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Load default aircraft on mount
  useEffect(() => {
    handleSelectAircraft('f16')
  }, [])
  
  return (
    <div className="aircraft-selector">
      <h4>Select Aircraft</h4>
      <div className="aircraft-list">
        {availableAircraft.map(aircraft => (
          <button
            key={aircraft.id}
            className={`aircraft-item ${selectedAircraft === aircraft.id ? 'selected' : ''}`}
            onClick={() => handleSelectAircraft(aircraft.id)}
            disabled={loading}
          >
            <span className="aircraft-name">{aircraft.name}</span>
            {loadedAircraft.has(aircraft.id) && <span className="loaded-badge">✓</span>}
          </button>
        ))}
      </div>
      {loading && <div className="loading-indicator">Loading aircraft...</div>}
    </div>
  )
}