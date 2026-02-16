"""
Quick setup script for GPU Code Optimizer AI
"""

import subprocess
import sys
import os

def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"\n{'='*60}")
    print(f"📦 {description}")
    print(f"{'='*60}")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        if e.stderr:
            print(e.stderr)
        return False

def check_ollama():
    """Check if Ollama is installed and running"""
    print("\n🔍 Checking Ollama installation...")
    try:
        result = subprocess.run("ollama list", shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Ollama is installed and running")
            print("\nAvailable models:")
            print(result.stdout)
            
            if "nemotron" in result.stdout.lower():
                print("✅ Nemotron model is installed")
            else:
                print("\n⚠️  Nemotron model not found!")
                print("📥 Installing Nemotron model (this may take a few minutes)...")
                run_command("ollama pull nemotron", "Installing Nemotron")
            return True
        else:
            print("❌ Ollama is not running")
            return False
    except FileNotFoundError:
        print("❌ Ollama is not installed")
        print("\n📖 Please install Ollama from: https://ollama.ai")
        return False

def main():
    print("""
    ⚡ GPU Code Optimizer AI - Setup Script
    ========================================
    This will set up your environment for the GPU Code Optimizer AI
    """)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        sys.exit(1)
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    
    # Install dependencies
    if not run_command("pip install -r requirements.txt", "Installing Python dependencies"):
        print("\n❌ Failed to install dependencies")
        sys.exit(1)
    
    # Check Ollama
    ollama_ok = check_ollama()
    
    print("\n" + "="*60)
    print("📋 Setup Summary")
    print("="*60)
    print("✅ Python dependencies installed")
    print(f"{'✅' if ollama_ok else '❌'} Ollama {'ready' if ollama_ok else 'not available'}")
    
    if ollama_ok:
        print("\n🚀 Setup complete! Run the application with:")
        print("   python app.py")
        print("\nThen open your browser to: http://localhost:8000")
    else:
        print("\n⚠️  Please install Ollama and run this script again")
        print("   Download from: https://ollama.ai")
    
    print("\n📖 See README.md for more details")

if __name__ == "__main__":
    main()
