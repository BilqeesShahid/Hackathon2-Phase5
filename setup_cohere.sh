#!/bin/bash
# Cohere Integration Setup Script

echo "🚀 Setting up Cohere AI Integration for Todo Chatbot"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python 3.8+"
    exit 1
fi

# Check if pip is available
if ! command -v pip &> /dev/null; then
    echo "❌ pip is not installed. Please install pip"
    exit 1
fi

echo "✅ Python environment verified"

# Install Cohere library
echo "📦 Installing Cohere library..."
pip install cohere

if [ $? -eq 0 ]; then
    echo "✅ Cohere library installed successfully"
else
    echo "❌ Failed to install Cohere library"
    exit 1
fi

# Check if .env file exists
if [ -f ".env" ]; then
    echo "🔍 Checking .env file for Cohere configuration..."

    # Check if COHERE_API_KEY is already set
    if grep -q "COHERE_API_KEY=" .env; then
        echo "ℹ️  Cohere API key configuration already exists in .env"
    else
        echo "" >> .env
        echo "# Cohere AI Configuration" >> .env
        echo "COHERE_API_KEY=your-cohere-api-key-here  # Update this with your actual key" >> .env
        echo "COHERE_MODEL=command-r-plus" >> .env
        echo "COHERE_TEMPERATURE=0.7" >> .env
        echo "✅ Added Cohere configuration to .env file"
    fi
else
    echo "❌ .env file not found. Please create one based on .env.example"
    exit 1
fi

# Verify the backend requirements
if [ -f "src/backend/requirements.txt" ]; then
    if grep -q "cohere" src/backend/requirements.txt; then
        echo "✅ Cohere dependency found in requirements.txt"
    else
        echo "❌ Cohere dependency not found in requirements.txt"
        echo "   Please add 'cohere>=4.0.0' to src/backend/requirements.txt"
    fi
else
    echo "❌ Backend requirements.txt not found"
fi

echo ""
echo "🎉 Cohere Integration Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Get your Cohere API key from: https://dashboard.cohere.com/api-keys"
echo "   2. Update COHERE_API_KEY in your .env file"
echo "   3. Choose your preferred model (command-r-plus recommended)"
echo "   4. Restart your application"
echo ""
echo "📖 For detailed setup instructions, see: COHERE_INTEGRATION_GUIDE.md"
echo ""