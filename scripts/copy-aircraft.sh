#!/bin/bash

# Copy all aircraft files from YSFLIGHT to public directory
# This script should be run from the webflight directory

SOURCE_DIR="../YSFLIGHT/runtime/aircraft"
DEST_DIR="public/aircraft"

if [ ! -d "$SOURCE_DIR" ]; then
    echo "Error: YSFLIGHT aircraft directory not found at $SOURCE_DIR"
    exit 1
fi

if [ ! -d "$DEST_DIR" ]; then
    echo "Creating destination directory: $DEST_DIR"
    mkdir -p "$DEST_DIR"
fi

echo "Copying aircraft files from $SOURCE_DIR to $DEST_DIR..."

# Copy aircraft.lst
cp "$SOURCE_DIR/aircraft.lst" "$DEST_DIR/"

# Copy all .dat files
echo "Copying .dat files..."
cp "$SOURCE_DIR"/*.dat "$DEST_DIR/" 2>/dev/null

# Copy all .dnm files
echo "Copying .dnm files..."
cp "$SOURCE_DIR"/*.dnm "$DEST_DIR/" 2>/dev/null

# Copy all .srf files
echo "Copying .srf files..."
cp "$SOURCE_DIR"/*.srf "$DEST_DIR/" 2>/dev/null

# Count copied files
DAT_COUNT=$(ls -1 "$DEST_DIR"/*.dat 2>/dev/null | wc -l)
DNM_COUNT=$(ls -1 "$DEST_DIR"/*.dnm 2>/dev/null | wc -l)
SRF_COUNT=$(ls -1 "$DEST_DIR"/*.srf 2>/dev/null | wc -l)

echo "Copying complete!"
echo "  - $DAT_COUNT .dat files"
echo "  - $DNM_COUNT .dnm files"
echo "  - $SRF_COUNT .srf files"
echo "  - 1 aircraft.lst file"

echo "Total size: $(du -sh "$DEST_DIR" | cut -f1)"