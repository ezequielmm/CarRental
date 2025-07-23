#!/bin/bash

# Fix permissions for all scripts
echo "Fixing script permissions..."

# Make all shell scripts executable
find scripts -name "*.sh" -type f -exec chmod +x {} \;

echo "Script permissions fixed successfully!"

# List all scripts with their permissions
echo ""
echo "Script permissions status:"
ls -la scripts/*.sh