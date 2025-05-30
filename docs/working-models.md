# Working Aircraft Models

This document lists the aircraft models that have been tested and confirmed to work with WebFlight's DNM and SRF parsers.

## Successfully Loaded Models

### Fighter Aircraft

#### F-16 Fighting Falcon
- **Files**: `f16.dat`, `f16.dnm`, `f16coll.srf`, `f16cockpit.srf`, `f16_coarse.dnm`
- **Status**: ✅ Fully working
- **Vertices**: 1,156 (main), 108 (cockpit)
- **Features**: Collision model, cockpit, LOD
- **Notes**: One of the most complete aircraft models

#### F/A-18 Hornet
- **Files**: `f18.dat`, `f18.dnm`, `f18coll.srf`, `f18cockpit.srf`, `f18_coarse.dnm`
- **Status**: ✅ Fully working
- **Vertices**: 857
- **Features**: Collision model, cockpit, LOD

#### F-22 Raptor
- **Files**: `f22.dat`, `f22.dnm`, `f22coll.srf`, `f22cockpit.srf`, `f22_coarse.dnm`
- **Status**: ✅ Fully working
- **Features**: Collision model, cockpit, LOD
- **Special**: Includes fuel tank model (`f22_fueltank.srf`)

#### P-51 Mustang
- **Files**: `p51.dat`, `p51.dnm`, `p51coll.srf`, `p51cockpit.srf`, `p51coarse.dnm`
- **Status**: ✅ Fully working
- **Vertices**: 4,876
- **Features**: Collision model, cockpit, LOD
- **Notes**: WWII fighter with detailed model

#### MiG-29
- **Files**: `mig29.dat`, `mig29.dnm`, `mig29coll.srf`, `mig29cockpit.srf`, `mig29_coarse.dnm`
- **Status**: ✅ Fully working
- **Features**: Collision model, cockpit, LOD

### General Aviation

#### Cessna 172
- **Files**: `cessna172r.dat`, `cessna172r.dnm`, `cessna172_collision.srf`, `cessna172_cockpit.srf`
- **Status**: ✅ Fully working
- **Features**: Collision model, cockpit
- **Notes**: Popular general aviation aircraft

### Attack Aircraft

#### A-10 Thunderbolt II
- **Files**: `a10.dat`, `a10.dnm`, `a10coll.srf`, `a10cockpit.srf`, `a10coarse.dnm`
- **Status**: ✅ Fully working
- **Vertices**: 4,535
- **Features**: Collision model, cockpit, LOD

### Commercial Aircraft

#### Boeing 747
- **Files**: `b747.dat`, `b747.dnm`, `b747coll.srf`, `b747cockpit.srf`, `b747coarse.dnm`
- **Status**: ✅ Fully working
- **Features**: Collision model, cockpit, LOD
- **Notes**: Large airliner model

### WWII Aircraft

#### Supermarine Spitfire
- **Files**: `spitfire.dat`, `spitfire.dnm`, `spitfire_coll.srf`, `spitfire_cockpit.srf`, `spitfire_coarse.dnm`
- **Status**: ✅ Fully working
- **Features**: Collision model, cockpit, LOD

### Helicopters

#### AH-64 Apache
- **Files**: `ah64.dat`, `ah64.dnm`, `ah64coll.srf`, `ah64cockpit.srf`
- **Status**: ✅ Fully working
- **Features**: Collision model, cockpit
- **Notes**: Attack helicopter

## Model Loading Performance

| Aircraft | Main Geometry | Load Time |
|----------|---------------|-----------|
| F-16 | 1,156 vertices | ~50ms |
| Cessna 172 | Variable | ~30ms |
| A-10 | 4,535 vertices | ~80ms |
| F-18 | 857 vertices | ~40ms |
| P-51 | 4,876 vertices | ~90ms |

## File Format Notes

### DNM Files
- Dynamic model files containing vertex and polygon data
- Simplified parser handles most models successfully
- PCK format references are skipped (not critical for display)

### SRF Files
- Surface files for collision detection and cockpit models
- Successfully parsed with symmetry support
- Color and normal data preserved

### DAT Files
- Aircraft data files containing flight characteristics
- Parsed for metadata but not required for visual display

## Testing Methodology

1. **Integration Tests**: Automated tests verify file loading and parsing
2. **Visual Tests**: Manual verification of 3D model rendering
3. **Performance Tests**: Load time measurements for optimization
4. **Memory Tests**: Polygon count limits enforced (10,000 max)

## Known Issues

1. **PCK Format**: Some DNM files reference PCK-packed SRF files that don't exist as standalone files
2. **Missing LOD**: Some aircraft don't have coarse (LOD) models
3. **Texture Support**: Textures are not yet implemented

## Future Improvements

1. Add texture loading support
2. Implement PCK format unpacking
3. Add more aircraft to the tested list
4. Optimize loading for mobile devices