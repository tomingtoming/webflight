# YSFlight Resources Documentation

## Executive Summary

This document provides a comprehensive analysis of YSFlight's resource structure, focusing on the aircraft model system. The investigation reveals that YSFlight uses a hybrid approach combining embedded and external surface files, which has significant implications for WebFlight implementation.

## Key Discoveries

### 1. Dual Surface System

YSFlight employs two distinct systems for storing 3D surface data:

1. **Embedded Surfaces (PCK System)**
   - Numbered files (e.g., `00000025.srf`)
   - Stored within DNM files using PCK directives
   - 185 unique embedded surfaces (00000007.srf to 00000191.srf)
   - Used for main aircraft geometry

2. **External Surfaces (File System)**
   - Named files (e.g., `a10cockpit.srf`)
   - Stored as separate files
   - 147 external SRF files in the aircraft directory
   - Used for cockpits, collision models, and LOD variants

### 2. File Structure Analysis

#### DNM (Dynamic Model) Files
```
Structure:
├── Header (DYNAMODEL, DNMVER)
├── PCK Sections (Embedded Surface Data)
│   ├── PCK 00000025.srf 1355
│   └── [Surface geometry data]
└── SRF Sections (Surface References)
    ├── FIL references
    └── Transformation matrices
```

#### SRF File Types
- `*cockpit.srf` - Interior cockpit geometry
- `*coll.srf` - Collision detection geometry
- `*_coarse.srf` - Low-detail LOD models
- `*.srf` - General surface files

### 3. Resource Statistics

| Resource Type | Count | Purpose |
|--------------|-------|---------|
| DNM Files | 180+ | Main aircraft models |
| Embedded SRFs | 185 | Component geometry |
| External SRFs | 147 | Specialized geometry |
| Coarse Models | 47 | LOD optimization |
| Cockpit Models | 70+ | Interior views |
| Collision Models | 70+ | Physics simulation |

### 4. Aircraft Resource Mapping

#### Complete Aircraft Package
A typical aircraft includes:
1. Main model (`.dnm`)
2. Coarse model (`_coarse.dnm`) - optional
3. Cockpit model (`*cockpit.srf`)
4. Collision model (`*coll.srf`)
5. Data file (`.dat`) - flight parameters

#### Example: F-22 Raptor
```
f22.dnm          - Main model with embedded surfaces
f22_coarse.dnm   - Low-detail version
f22cockpit.srf   - Cockpit interior
f22coll.srf      - Collision geometry
f22_fueltank.srf - External fuel tank (special)
f22.dat          - Flight characteristics
```

### 5. Implementation Priority

Based on complexity analysis, the recommended implementation order is:

#### Phase 1: Simple Aircraft (Proof of Concept)
1. **Cessna 172R** - Uses named surfaces, simpler structure
2. **Piper Archer** - Similar complexity, good validation
3. **Eclipse 500** - Small jet, tests different features

#### Phase 2: Military Trainers (Core Features)
4. **T-4 Blue Impulse** - Introduces numbered surfaces
5. **Hawk** - British trainer, clean structure
6. **Alpha Jet** - Aerobatic features

#### Phase 3: Fighters (Advanced Features)
7. **P-51 Mustang** - Classic fighter, propeller aircraft
8. **F-16 Fighting Falcon** - Modern jet fighter
9. **F-18 Hornet** - Carrier operations

#### Phase 4: Complex Aircraft (Full Implementation)
10. **F-22 Raptor** - Most complex fighter
11. **Boeing 747** - Large civilian aircraft
12. **AV-8B Harrier** - VTOL capabilities

### 6. Technical Implementation Guide

#### Parser Requirements
1. **DNM Parser**
   - Extract header information
   - Parse PCK sections for embedded surfaces
   - Build surface reference tree
   - Handle transformation matrices

2. **SRF Loader**
   - Load external SRF files
   - Support both ASCII and binary formats
   - Cache parsed geometry

3. **Resource Manager**
   - Unified interface for embedded/external surfaces
   - Lazy loading for performance
   - Memory management for large models

#### Recommended Architecture
```
WebFlight Resource System
├── Parser Module
│   ├── DNM Parser
│   ├── SRF Parser
│   └── DAT Parser
├── Resource Manager
│   ├── Surface Cache
│   ├── Model Registry
│   └── LOD Manager
└── Renderer
    ├── WebGL Renderer
    ├── Shader System
    └── Animation Engine
```

### 7. File Format Specifications

#### DNM File Commands
- `DYNAMODEL` - File identifier
- `DNMVER 2` - Version number
- `PCK` - Pack embedded surface
- `FIL` - File reference
- `SRF` - Surface definition
- `POS` - Position data
- `ATT` - Attitude/rotation
- `CLA` - Classification

#### SRF File Structure
- Vertex definitions (V, N, C)
- Polygon definitions (B, T, Q)
- Material properties
- Texture coordinates

### 8. Migration Strategy

1. **Start with External SRFs**
   - Easier to parse and test
   - Immediate visual results
   - Build confidence in parser

2. **Add PCK Support**
   - Extract embedded surfaces
   - Virtual file system for numbered SRFs
   - Cache extracted data

3. **Implement LOD System**
   - Use coarse models for distance
   - Dynamic quality adjustment
   - Performance optimization

4. **Complete Feature Set**
   - Animations (control surfaces, landing gear)
   - Special effects (afterburner, vapor trails)
   - Damage models

### 9. Performance Considerations

1. **Model Complexity**
   - Simple models: 5-10 surfaces
   - Complex models: 20-40 surfaces
   - Large aircraft: 50+ surfaces

2. **Optimization Strategies**
   - Aggressive caching of parsed data
   - LOD switching based on distance
   - Culling of non-visible surfaces
   - Texture atlasing for efficiency

3. **Memory Footprint**
   - Cessna 172R: ~500KB total
   - F-22 Raptor: ~2MB total
   - Boeing 747: ~3MB total

### 10. Conclusion

The YSFlight resource system is well-structured but requires careful parsing due to its hybrid embedded/external surface approach. The numbered SRF files that appear to be "missing" are actually embedded within DNM files by design. 

For WebFlight implementation:
1. Build a robust DNM parser with PCK extraction
2. Start with simple models for testing
3. Progressively add features with more complex aircraft
4. Focus on performance from the beginning
5. Maintain compatibility with original file formats

This investigation provides the foundation needed to build a complete WebFlight model loading system that can handle all YSFlight aircraft resources.