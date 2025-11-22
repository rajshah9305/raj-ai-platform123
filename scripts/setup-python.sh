#!/bin/bash

# Setup Python environment for RAJ AI PLATFORM
echo "Setting up Python environment for RAJ AI PLATFORM..."

# Check if Python 3.11+ is available
if command -v python3.11 &> /dev/null; then
    PYTHON_CMD=python3.11
elif command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    if [[ $(echo "$PYTHON_VERSION >= 3.11" | bc -l) -eq 1 ]]; then
        PYTHON_CMD=python3
    else
        echo "Error: Python 3.11+ is required. Found Python $PYTHON_VERSION"
        exit 1
    fi
else
    echo "Error: Python 3 is not installed"
    exit 1
fi

echo "Using Python: $PYTHON_CMD"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "RAJ AI PLATFORM Python environment setup complete!"
echo "To activate the environment manually, run: source venv/bin/activate"