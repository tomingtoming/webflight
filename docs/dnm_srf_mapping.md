# DNM to SRF File Mapping Documentation

## Overview
This document provides a complete mapping between YSFlight's DNM (Dynamic Model) files and their associated SRF (Surface) files.

## Key Findings

### 1. Two Surface Reference Systems

#### Embedded Surfaces (PCK System)
- **Format**: Numbered files like `00000025.srf`
- **Storage**: Embedded within DNM files, not stored as separate files
- **Range**: 00000007.srf to 00000191.srf (185 unique surfaces)
- **Usage**: Main aircraft geometry components

#### External Surfaces (File System)
- **Format**: Named files like `a10cockpit.srf`, `a10coll.srf`
- **Storage**: Separate files in the aircraft directory
- **Count**: 147 external SRF files
- **Types**:
  - `*cockpit.srf` - Cockpit interior geometry
  - `*coll.srf` - Collision detection geometry
  - `*coarse.srf` - Low-detail model variants

### 2. DNM File Structure

```
DNM File Layout:
├── Header
│   ├── DYNAMODEL
│   └── DNMVER 2
├── PCK Sections (Embedded Surface Data)
│   ├── PCK 00000025.srf 1355
│   ├── [Surface geometry data]
│   └── ...
└── SRF Sections (Surface References)
    ├── SRF
    ├── FIL 00000025.srf
    └── Transformation data
```

### 3. Aircraft Resource Mapping

| Aircraft | DNM Files | Embedded SRFs | External SRFs |
|----------|-----------|---------------|---------------|
| A-10 Thunderbolt | a10.dnm, a10coarse.dnm | 00000025-00000039 | a10cockpit.srf, a10coll.srf |
| F-22 Raptor | f22.dnm, f22_coarse.dnm | Multiple ranges | f22cockpit.srf, f22coll.srf, f22_fueltank.srf |
| F-16 Fighting Falcon | f16.dnm, f16_coarse.dnm | Multiple ranges | f16cockpit.srf, f16coll.srf |
| F-18 Hornet | f18.dnm, f18_coarse.dnm | Multiple ranges | f18cockpit.srf, f18coll.srf |
| Boeing 747 | b747.dnm, b747coarse.dnm | Multiple ranges | b747cockpit.srf, b747coll.srf |
| Cessna 172R | cessna172r.dnm | Named surfaces | cessna172_cockpit.srf, cessna172_collision.srf |

### 4. Surface Types and Usage

#### Embedded Surfaces (in DNM files)
- **Purpose**: Main aircraft geometry
- **Structure**: Hierarchical component system
- **Examples**:
  - Fuselage sections
  - Wing components
  - Control surfaces
  - Engine nacelles

#### External Cockpit Surfaces
- **Files**: `*cockpit.srf`
- **Purpose**: Interior cockpit geometry
- **Usage**: First-person view rendering

#### External Collision Surfaces
- **Files**: `*coll.srf`
- **Purpose**: Simplified geometry for physics
- **Usage**: Collision detection and damage modeling

#### External Coarse Surfaces
- **Files**: `*_coarse.srf`
- **Purpose**: Low-detail models
- **Usage**: Distance LOD rendering

### 5. Special Cases

#### Civilian Aircraft
- Often use named surfaces instead of numbered ones
- Example: Cessna 172R uses "Fuselage", "Wing" instead of numbers

#### Military Aircraft Variants
- F-15DJ has multiple color variants (chairo, kuro, madara, etc.)
- Each variant has its own DNM and coarse DNM files

#### Unique Models
- F-22 has additional `f22_fueltank.srf` for external fuel tanks
- Some aircraft have `*_rear.ist` files for rear seat instruments

### 6. Non-Existent Referenced Files

All numbered SRF files (00000XXX.srf) referenced in DNM files are embedded and do not exist as separate files. This is by design - the PCK directive embeds the surface data directly into the DNM file.

### 7. Implementation Notes

For WebFlight implementation:
1. **DNM Parser Required**: Must extract embedded PCK data
2. **Resource Manager**: Handle both embedded and external surfaces
3. **Caching Strategy**: Store parsed surfaces to avoid re-parsing
4. **LOD System**: Use coarse models for distance rendering
5. **Collision System**: Load separate collision geometry

### 8. Recommended Loading Order

1. Parse main DNM file
2. Extract all embedded surfaces (PCK data)
3. Load external cockpit surface (if exists)
4. Load external collision surface (if exists)
5. Load coarse model variant (if needed for LOD)

## Summary

The YSFlight model system uses a hybrid approach:
- Complex geometry is embedded within DNM files using the PCK system
- Specialized geometry (cockpit, collision) is stored in external SRF files
- This design allows for efficient loading and modular aircraft construction

Total Resources:
- 185 unique embedded surfaces (numbered)
- 147 external SRF files (named)
- Average 10-20 surfaces per aircraft model