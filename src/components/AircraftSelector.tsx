import { useState, useEffect } from 'react'
import { AircraftManager, AircraftDefinition } from '@/managers/AircraftManager'
import { AircraftListEntry } from '@/loaders/AircraftListParser'
import './AircraftSelector.css'

interface AircraftSelectorProps {
  onAircraftSelected: (aircraftId: string) => void
  aircraftManager: AircraftManager
  loadAllFromList?: boolean
}

// Default aircraft for quick access
const defaultAircraft: Array<{ id: string; name: string; definition: AircraftDefinition }> = [
  {
    id: 'f16',
    name: 'F-16 Fighting Falcon',
    definition: {
      dataFile: 'f16.dat',
      modelFile: 'f16.dnm',
      collisionFile: 'f16coll.srf',
      cockpitFile: 'f16cockpit.srf',
      lodFile: 'f16_coarse.dnm'
    }
  },
  {
    id: 'cessna172',
    name: 'Cessna 172',
    definition: {
      dataFile: 'cessna172r.dat',
      modelFile: 'cessna172r.dnm',
      collisionFile: 'cessna172_collision.srf',
      cockpitFile: 'cessna172_cockpit.srf'
    }
  }
]

export function AircraftSelector({ onAircraftSelected, aircraftManager, loadAllFromList = false }: AircraftSelectorProps) {
  const [selectedAircraft, setSelectedAircraft] = useState('f16')
  const [loading, setLoading] = useState(false)
  const [loadedAircraft, setLoadedAircraft] = useState<Set<string>>(new Set())
  const [availableAircraft, setAvailableAircraft] = useState<AircraftListEntry[]>(defaultAircraft)
  const [showAll, setShowAll] = useState(false)
  
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
  
  // Load aircraft list on mount if requested
  useEffect(() => {
    if (loadAllFromList) {
      loadAircraftList()
    }
    handleSelectAircraft('f16')
  }, [])
  
  const loadAircraftList = async () => {
    setLoading(true)
    try {
      const aircraftList = await aircraftManager.loadAircraftList()
      setAvailableAircraft(aircraftList)
      console.log(`Loaded ${aircraftList.length} aircraft from aircraft.lst`)
    } catch (error) {
      console.error('Failed to load aircraft list:', error)
      // Fall back to default aircraft
      setAvailableAircraft(defaultAircraft)
    } finally {
      setLoading(false)
    }
  }
  
  // Filter aircraft based on category or search
  const displayedAircraft = showAll ? availableAircraft : availableAircraft.slice(0, 10)
  
  return (
    <div className="aircraft-selector">
      <div className="aircraft-selector-header">
        <h4>Select Aircraft</h4>
        {availableAircraft.length > 10 && (
          <button 
            className="toggle-all-button"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : `Show All (${availableAircraft.length})`}
          </button>
        )}
      </div>
      
      {loadAllFromList && availableAircraft.length === 0 && (
        <button 
          className="load-all-button"
          onClick={loadAircraftList}
          disabled={loading}
        >
          Load Aircraft List
        </button>
      )}
      
      <div className="aircraft-list">
        {displayedAircraft.map(aircraft => (
          <button
            key={aircraft.id}
            className={`aircraft-item ${selectedAircraft === aircraft.id ? 'selected' : ''}`}
            onClick={() => handleSelectAircraft(aircraft.id)}
            disabled={loading}
            title={aircraft.name}
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