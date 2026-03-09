#!/bin/bash

# Build script that includes copying SQL files and other assets
echo "Building application with assets..."

# Build the frontend and backend
npm run build

# Copy SQL files to dist directory (create directory if it doesn't exist)
echo "Copying SQL files to dist..."
mkdir -p dist/scripts
cp -r server/scripts/* dist/scripts/ 2>/dev/null || echo "No SQL scripts to copy"

# Copy any other necessary assets
echo "Copying other assets..."
# Add more asset copying as needed

echo "Build completed with assets!"