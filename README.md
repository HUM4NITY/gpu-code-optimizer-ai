# ⚡ GPU Code Optimizer AI

An AI-powered code analysis tool that uses **NVIDIA Nemotron models** via Ollama to identify GPU optimization opportunities in your code. Built for the NVIDIA GTC 2026 Golden Ticket Developer Contest.

![NVIDIA](https://img.shields.io/badge/NVIDIA-Nemotron-76B900?style=for-the-badge&logo=nvidia)
![Ollama](https://img.shields.io/badge/Ollama-Powered-000000?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi)

## 🎯 What It Does

GPU Code Optimizer AI analyzes Python, CUDA, and C++ code to identify performance bottlenecks and suggest specific optimizations:

- **Memory Coalescing** - Detect uncoalesced memory accesses
- **Kernel Fusion** - Identify opportunities to combine kernels
- **Shared Memory** - Suggest shared memory optimizations
- **Tensor Core Utilization** - Recommend tensor core operations
- **GPU Occupancy** - Analyze thread block configurations
- **Memory Bandwidth** - Optimize data transfer patterns
- **Compute Intensity** - Improve arithmetic intensity
- **Parallelism** - Find parallelization opportunities

## 🚀 Quick Start

### Prerequisites

1. **Install Ollama**: [https://ollama.ai](https://ollama.ai)
2. **Install NVIDIA Nemotron model**:
   ```bash
   ollama pull nemotron
   ```
3. **Python 3.8+**

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Run the Application

```bash
python app.py
```

Then open your browser to: **http://localhost:8000**

## 📖 Usage

1. **Paste Your Code** - Enter Python, CUDA, or C++ GPU code
2. **Select Model** - Choose NVIDIA Nemotron or other available models
3. **Analyze** - Click "Analyze & Optimize"
4. **Get Results** - Receive detailed optimization suggestions with:
   - Severity levels (Critical, High, Medium, Low)
   - Specific issues and solutions
   - Code examples
   - Estimated speedup predictions

### Example Analysis

```python
import torch

def inefficient_batch_process(data):
    results = []
    for item in data:
        item_gpu = item.cuda()
        result = model(item_gpu)
        results.append(result.cpu())
    return results
```

**The AI will identify:**
- ❌ CPU-GPU transfer overhead
- ❌ No batch processing
- ❌ Synchronous execution
- ✅ **Suggested optimization**: Batch processing with single GPU transfer

## 🏗️ Architecture

```
gpu-code-optimizer/
├── app.py                 # FastAPI backend
├── static/
│   ├── index.html        # Web interface
│   ├── style.css         # Styling
│   └── script.js         # Frontend logic
├── requirements.txt      # Python dependencies
└── README.md            # Documentation
```

**Tech Stack:**
- **Backend**: FastAPI for high-performance async API
- **AI Engine**: Ollama with NVIDIA Nemotron models
- **Frontend**: Vanilla JavaScript (no frameworks needed!)
- **Analysis**: Custom prompt engineering for GPU optimization

## 🎮 Features

### Real-Time Analysis
- Instant feedback on code quality
- Interactive web interface
- Multiple model support

### Comprehensive Detection
- Memory access patterns
- Kernel optimization opportunities
- Thread configuration issues
- Data transfer inefficiencies

### Actionable Insights
- Specific code examples
- Estimated performance gains
- Severity-based prioritization
- Category-based grouping

### Developer Friendly
- Simple setup (< 5 minutes)
- No GPU required to run the analyzer
- Works with existing code
- Export and share results

## 🧪 Example Code Samples

The application includes built-in examples:

1. **Inefficient CUDA Kernel** - Matrix multiplication with poor memory access
2. **Python GPU Computing** - PyTorch code with optimization opportunities
3. **NumPy Vectorization** - CPU code that could benefit from GPU acceleration

Click "📋 Load Example" in the UI to try them!

## 🔧 API Endpoints

### POST `/api/analyze`
Analyze code for GPU optimizations

**Request:**
```json
{
  "code": "your code here",
  "language": "python",
  "model": "nemotron"
}
```

**Response:**
```json
{
  "optimizations": [...],
  "summary": "Analysis summary",
  "overall_score": 85,
  "model_used": "nemotron"
}
```

### GET `/api/models`
List available Ollama models

### GET `/api/examples`
Get example code snippets

### GET `/api/health`
Health check endpoint

## 🎓 How It Works

1. **Code Submission** - User submits code through web interface
2. **Prompt Engineering** - System creates a detailed analysis prompt
3. **AI Analysis** - Nemotron model analyzes code for GPU patterns
4. **Result Parsing** - Structured JSON response with optimizations
5. **Visualization** - Results displayed with severity and categories

## 🏆 NVIDIA GTC Contest Submission

This project is designed for the **NVIDIA GTC Golden Ticket Developer Contest**:

### Targets Multiple Challenges:
- ✅ **Ollama Challenge**: Built with Ollama and open models
- ✅ **Bryan Catanzaro**: Showcases NVIDIA Nemotron models
- ✅ **Sabrina Koumoin**: Demonstrates NVIDIA technology

### Why This Project Stands Out:
1. **Practical Value** - Solves real GPU optimization challenges
2. **NVIDIA Focus** - Directly aligned with GPU performance
3. **Nemotron Showcase** - Highlights model capabilities
4. **Open Source** - Community-driven development
5. **Production Ready** - Clean architecture, good UX

## 🚀 Future Enhancements

- [ ] Multi-file project analysis
- [ ] Integration with VS Code extension
- [ ] Performance benchmarking tools
- [ ] CI/CD pipeline integration
- [ ] Support for more languages (Rust, Julia)
- [ ] Automatic code refactoring
- [ ] Historical analysis tracking

## 📝 License

MIT License - Feel free to use, modify, and distribute!

## 🤝 Contributing

Contributions welcome! This is an open-source project for the NVIDIA developer community.

## 📧 Contact

Built by a developer passionate about GPU computing and AI.

**For NVIDIA GTC Contest:**
- Tag: #NVIDIAGTC
- Models: NVIDIA Nemotron via Ollama
- Category: Developer Tools, GPU Optimization, AI

## 🙏 Acknowledgments

- **NVIDIA** for Nemotron models and GPU technology
- **Ollama** for making model deployment simple
- **FastAPI** for excellent Python web framework
- **Open Source Community** for inspiration

---

**⚡ Built with NVIDIA Nemotron | Powered by Ollama | For Developers, By Developers**
