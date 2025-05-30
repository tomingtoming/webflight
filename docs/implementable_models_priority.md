# Implementable Models Priority List

## Prioritization Criteria
1. **Complexity**: Simpler models first for proof of concept
2. **File Completeness**: Models with all required files available
3. **Popularity**: Commonly used aircraft in flight simulation
4. **Technical Features**: Progressive complexity for feature development

## Priority Tiers

### Tier 1: Simple Models (Start Here)
These models use named surfaces and have simpler geometry, making them ideal for initial implementation.

| Priority | Aircraft | Model Files | Why Start Here |
|----------|----------|-------------|----------------|
| 1 | **Cessna 172R** | cessna172r.dnm, cessna172_cockpit.srf, cessna172_collision.srf | • Uses named surfaces (easier to parse)<br>• Popular civilian aircraft<br>• Complete file set<br>• Good for testing basic features |
| 2 | **Piper Archer** | archer.dnm, archer_cockpit.srf, archer_coll.srf | • Simple geometry<br>• Similar structure to Cessna<br>• Good second test case |
| 3 | **Eclipse 500** | eclipse.dnm, eclipse_cockpit.srf, eclipse_coll.srf | • Modern civilian jet<br>• Still relatively simple<br>• Tests jet features |

### Tier 2: Military Trainers
Transition to numbered surface system with moderate complexity.

| Priority | Aircraft | Model Files | Key Features |
|----------|----------|-------------|--------------|
| 4 | **T-4 Blue Impulse** | t4blue.dnm, t4blue_coarse.dnm, t4cockpit.srf, t4coll.srf | • Japanese trainer<br>• Has coarse model for LOD<br>• Moderate complexity |
| 5 | **Hawk** | hawk.dnm, hawk_coarse.dnm, hawk_cockpit.srf, hawk_coll.srf | • British trainer<br>• Well-structured files<br>• Good for testing LOD |
| 6 | **Alpha Jet** | alphajet.dnm, alphajet_coarse.dnm, alphajet_cockpit.srf, alphajet_coll.srf | • Aerobatic capable<br>• Tests control surfaces |

### Tier 3: Classic Fighters
Historical aircraft with moderate to high detail.

| Priority | Aircraft | Model Files | Implementation Value |
|----------|----------|-------------|---------------------|
| 7 | **P-51 Mustang** | p51.dnm, p51coarse.dnm, p51cockpit.srf, p51coll.srf | • Iconic WWII fighter<br>• Popular choice<br>• Tests propeller rendering |
| 8 | **Spitfire** | spitfire.dnm, spitfire_coarse.dnm, spitfire_cockpit.srf, spitfire_coll.srf | • Another iconic fighter<br>• Similar complexity to P-51 |
| 9 | **A6M Zero** | a6m5.dnm, a6m5_coarse.dnm, a6m5_cockpit.srf, a6m5_coll.srf | • Japanese WWII fighter<br>• Different design philosophy |

### Tier 4: Modern Fighters
Complex models with advanced features.

| Priority | Aircraft | Model Files | Technical Challenges |
|----------|----------|-------------|---------------------|
| 10 | **F-16 Fighting Falcon** | f16.dnm, f16_coarse.dnm, f16cockpit.srf, f16coll.srf | • Single engine jet<br>• Bubble canopy<br>• Modern avionics |
| 11 | **F-18 Hornet** | f18.dnm, f18_coarse.dnm, f18cockpit.srf, f18coll.srf | • Carrier capable<br>• Twin engine<br>• Folding wings |
| 12 | **F-15 Eagle** | f15.dnm, f15coarse.dnm, f15cockpit.srf, f15coll.srf | • Air superiority fighter<br>• Large twin engine<br>• Complex geometry |

### Tier 5: Advanced/Special Aircraft
Most complex models with unique features.

| Priority | Aircraft | Model Files | Special Features |
|----------|----------|-------------|------------------|
| 13 | **F-22 Raptor** | f22.dnm, f22_coarse.dnm, f22cockpit.srf, f22coll.srf, f22_fueltank.srf | • Stealth geometry<br>• External fuel tanks<br>• Most complex fighter |
| 14 | **AV-8B Harrier** | av8b.dnm, av8b_coarse.dnm, av8b_cockpit.srf, av8b_coll.srf | • VTOL capability<br>• Unique animations<br>• Complex physics |
| 15 | **Concorde** | concorde.dnm, concorde_coarse.dnm, concordecockpit.srf, concordecoll.srf | • Supersonic airliner<br>• Droop nose<br>• Delta wing |

### Tier 6: Large Aircraft
Big models with many surfaces.

| Priority | Aircraft | Model Files | Size Challenges |
|----------|----------|-------------|-----------------|
| 16 | **Boeing 747** | b747.dnm, b747coarse.dnm, b747cockpit.srf, b747coll.srf | • Jumbo jet<br>• Many surfaces<br>• Performance test |
| 17 | **C-130 Hercules** | c130.dnm, c130_coarse.dnm, c130cockpit.srf, c130coll.srf | • Military transport<br>• Cargo door animations<br>• Propeller aircraft |
| 18 | **B-52 Stratofortress** | b52.dnm, b52_coarse.dnm, b52cockpit.srf, b52coll.srf | • 8 engines<br>• Very large<br>• Complex geometry |

## Implementation Roadmap

### Phase 1: Foundation (Models 1-3)
- Implement DNM parser for named surfaces
- Basic SRF file loading
- Simple rendering pipeline
- Test with Cessna 172R

### Phase 2: Surface System (Models 4-6)
- Add numbered surface (PCK) support
- Implement LOD system with coarse models
- Performance optimization
- Test with military trainers

### Phase 3: Feature Complete (Models 7-12)
- Animation support
- Advanced rendering features
- Texture mapping
- Test with fighters

### Phase 4: Advanced Features (Models 13-18)
- Special animations (VTOL, folding wings)
- Large model optimization
- Memory management
- Complete aircraft set

## Technical Recommendations

1. **Start Simple**: Begin with Cessna 172R
2. **Incremental Features**: Add complexity gradually
3. **Performance First**: Optimize early and often
4. **Modular Design**: Separate parser, loader, and renderer
5. **Cache Everything**: Parsed models, textures, and geometry

## Success Metrics

- **Phase 1**: Successfully render Cessna 172R
- **Phase 2**: Load and switch between LOD levels
- **Phase 3**: Render any fighter with full detail
- **Phase 4**: Handle largest aircraft without performance issues