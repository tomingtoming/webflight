# PCK-Referenced Non-Existent Files List

## Overview
This document lists all SRF files that are referenced in DNM files via PCK directives but do not exist as separate files in the filesystem. These are embedded surfaces that are part of YSFlight's design.

## Key Understanding
**All numbered SRF files (00000XXX.srf) are embedded within DNM files and intentionally do not exist as separate files.**

## Complete List of Embedded (Non-Existent) SRF Files

### Numbered Range: 00000007.srf to 00000191.srf

```
00000007.srf
00000008.srf
00000009.srf
00000010.srf
00000011.srf
00000012.srf
00000013.srf
00000014.srf
00000015.srf
00000016.srf
00000017.srf
00000018.srf
00000019.srf
00000020.srf
00000021.srf
00000022.srf
00000023.srf
00000024.srf
00000025.srf
00000026.srf
00000027.srf
00000028.srf
00000029.srf
00000030.srf
00000031.srf
00000032.srf
00000033.srf
00000034.srf
00000035.srf
00000036.srf
00000037.srf
00000038.srf
00000039.srf
00000040.srf
00000041.srf
00000042.srf
00000043.srf
00000044.srf
00000045.srf
00000046.srf
00000047.srf
00000048.srf
00000049.srf
00000050.srf
00000051.srf
00000052.srf
00000053.srf
00000054.srf
00000055.srf
00000056.srf
00000057.srf
00000058.srf
00000059.srf
00000060.srf
00000061.srf
00000062.srf
00000063.srf
00000064.srf
00000065.srf
00000066.srf
00000067.srf
00000068.srf
00000069.srf
00000070.srf
00000071.srf
00000072.srf
00000073.srf
00000074.srf
00000075.srf
00000076.srf
00000077.srf
00000078.srf
00000079.srf
00000080.srf
00000081.srf
00000082.srf
00000083.srf
00000084.srf
00000085.srf
00000086.srf
00000087.srf
00000088.srf
00000089.srf
00000090.srf
00000091.srf
00000092.srf
00000093.srf
00000094.srf
00000095.srf
00000096.srf
00000097.srf
00000098.srf
00000099.srf
00000100.srf
00000101.srf
00000102.srf
00000103.srf
00000104.srf
00000105.srf
00000106.srf
00000107.srf
00000108.srf
00000109.srf
00000110.srf
00000111.srf
00000112.srf
00000113.srf
00000114.srf
00000115.srf
00000116.srf
00000117.srf
00000118.srf
00000119.srf
00000120.srf
00000121.srf
00000122.srf
00000123.srf
00000124.srf
00000125.srf
00000126.srf
00000127.srf
00000128.srf
00000129.srf
00000130.srf
00000131.srf
00000132.srf
00000133.srf
00000134.srf
00000135.srf
00000136.srf
00000137.srf
00000138.srf
00000139.srf
00000140.srf
00000141.srf
00000142.srf
00000143.srf
00000144.srf
00000145.srf
00000146.srf
00000147.srf
00000148.srf
00000149.srf
00000150.srf
00000151.srf
00000152.srf
00000153.srf
00000154.srf
00000155.srf
00000156.srf
00000157.srf
00000158.srf
00000159.srf
00000160.srf
00000161.srf
00000162.srf
00000163.srf
00000164.srf
00000165.srf
00000166.srf
00000167.srf
00000168.srf
00000169.srf
00000170.srf
00000171.srf
00000172.srf
00000173.srf
00000174.srf
00000175.srf
00000176.srf
00000177.srf
00000178.srf
00000179.srf
00000180.srf
00000181.srf
00000182.srf
00000183.srf
00000184.srf
00000185.srf
00000186.srf
00000187.srf
00000188.srf
00000189.srf
00000190.srf
00000191.srf
```

**Total: 185 embedded surface files**

## Important Notes

1. **By Design**: These files are meant to be embedded, not external
2. **PCK Directive**: Each is defined by a PCK directive in DNM files
3. **Data Location**: The actual surface data follows the PCK directive in the DNM file
4. **No Missing Files**: This is not an error - it's how YSFlight stores complex models

## Implementation Implications

For WebFlight:
1. **Parser Requirement**: Must parse PCK sections from DNM files
2. **Virtual File System**: Treat embedded surfaces as virtual files
3. **Caching**: Cache extracted surfaces for performance
4. **Resource Manager**: Unified system for both embedded and external surfaces

## Example PCK Structure in DNM

```
PCK 00000025.srf 1355
ZZ -0.012308 0.295385 -0.138169
ZA -0.012308 0.295385 -0.138769
[... 1355 lines of vertex/polygon data ...]
```

The number after the filename (1355) indicates the number of lines of surface data that follow.

## Conclusion

All 185 numbered SRF files are embedded within DNM files using the PCK system. This is the intended design - they are not missing files but rather a different storage mechanism for complex 3D model data.