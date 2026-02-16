"""
GPU Code Optimizer AI - FastAPI Backend
Uses NVIDIA Nemotron models via Ollama to analyze and optimize GPU code
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
import httpx
import json
from typing import List, Dict, Optional
import re

app = FastAPI(title="GPU Code Optimizer AI")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")


class CodeAnalysisRequest(BaseModel):
    code: str
    language: str = "python"
    model: str = "nemotron"


class OptimizationSuggestion(BaseModel):
    category: str
    severity: str  # "critical", "high", "medium", "low"
    issue: str
    suggestion: str
    code_snippet: Optional[str] = None
    estimated_speedup: Optional[str] = None


class AnalysisResponse(BaseModel):
    optimizations: List[OptimizationSuggestion]
    summary: str
    overall_score: int
    model_used: str


# GPU Optimization Categories
OPTIMIZATION_CATEGORIES = {
    "memory_coalescing": "Memory Coalescing",
    "kernel_fusion": "Kernel Fusion",
    "shared_memory": "Shared Memory Usage",
    "tensor_cores": "Tensor Core Utilization",
    "occupancy": "GPU Occupancy",
    "bandwidth": "Memory Bandwidth",
    "compute_intensity": "Compute Intensity",
    "parallelism": "Thread Parallelism",
}


def create_analysis_prompt(code: str, language: str) -> str:
    """Create a detailed prompt for GPU code analysis"""
    prompt = f"""You are an expert GPU optimization engineer specialized in CUDA, Python, and high-performance computing. Analyze the following {language} code for GPU optimization opportunities.

Code to analyze:
```{language}
{code}
```

Provide a detailed analysis in the following JSON format:
{{
    "optimizations": [
        {{
            "category": "memory_coalescing|kernel_fusion|shared_memory|tensor_cores|occupancy|bandwidth|compute_intensity|parallelism",
            "severity": "critical|high|medium|low",
            "issue": "Clear description of the problem",
            "suggestion": "Specific optimization recommendation",
            "code_snippet": "Example of improved code (optional)",
            "estimated_speedup": "Estimated performance improvement (optional)"
        }}
    ],
    "summary": "Overall assessment of the code",
    "overall_score": 85
}}

Focus on:
1. Memory access patterns and coalescing
2. Opportunities for kernel fusion
3. Shared memory utilization
4. Tensor core operations (for matrix operations)
5. Thread block configuration and occupancy
6. Memory bandwidth optimization
7. Compute intensity improvements
8. Parallelization opportunities

Be specific and actionable in your suggestions. Provide code examples where helpful.
"""
    return prompt


async def analyze_with_ollama(code: str, language: str, model: str = "nemotron") -> Dict:
    """Use Ollama to analyze code with specified model"""
    content = ""
    try:
        # Create the analysis prompt
        prompt = create_analysis_prompt(code, language)
        
        # Call Ollama API using httpx
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": model,
                    "prompt": f"System: You are an expert GPU optimization engineer. Always respond with valid JSON only.\n\nUser: {prompt}",
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "num_predict": 2000,
                    }
                }
            )
            response.raise_for_status()
            result = response.json()
        
        # Extract the response content
        content = result.get('response', result.get('message', {}).get('content', ''))
        
        # Try to parse JSON from the response
        # Sometimes models wrap JSON in markdown code blocks
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
        if json_match:
            json_content = json_match.group(1)
        else:
            json_content = content
        
        # Parse the JSON response
        analysis = json.loads(json_content)
        
        # Validate the response structure
        if "optimizations" not in analysis:
            analysis["optimizations"] = []
        if "summary" not in analysis:
            analysis["summary"] = "Analysis completed"
        if "overall_score" not in analysis:
            analysis["overall_score"] = 50
            
        return analysis
        
    except json.JSONDecodeError as e:
        # If JSON parsing fails, return a structured error
        return {
            "optimizations": [{
                "category": "general",
                "severity": "medium",
                "issue": "Unable to parse full analysis",
                "suggestion": f"Raw response: {content[:500]}",
                "code_snippet": None,
                "estimated_speedup": None
            }],
            "summary": "Analysis parsing failed. Raw model output provided.",
            "overall_score": 0
        }
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Cannot connect to Ollama. Please ensure Ollama is running.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the main HTML page"""
    try:
        with open("static/index_v2.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>GPU Code Optimizer AI</h1><p>Frontend not found. Please ensure static/index_v2.html exists.</p>")


@app.get("/api/models")
async def list_models():
    """List available Ollama models"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:11434/api/tags")
            response.raise_for_status()
            models_data = response.json()
        
        model_names = [model['name'] for model in models_data.get('models', [])]
        
        # Filter for relevant models (Nemotron and others)
        return {
            "models": model_names,
            "recommended": [m for m in model_names if 'nemotron' in m.lower()]
        }
    except Exception as e:
        return {"models": [], "recommended": [], "error": str(e)}


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_code(request: CodeAnalysisRequest):
    """Analyze GPU code and provide optimization suggestions"""
    
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    try:
        # Perform analysis using Ollama
        analysis = await analyze_with_ollama(request.code, request.language, request.model)
        
        # Add model information
        analysis["model_used"] = request.model
        
        return JSONResponse(content=analysis)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check if Ollama is available
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:11434/api/tags")
            response.raise_for_status()
            models = response.json()
        return {
            "status": "healthy",
            "ollama_available": True,
            "models_count": len(models.get('models', []))
        }
    except Exception as e:
        return {
            "status": "degraded",
            "ollama_available": False,
            "error": str(e)
        }


@app.get("/api/examples")
async def get_examples():
    """Get example code snippets for testing"""
    examples = {
        "inefficient_cuda": {
            "name": "Inefficient CUDA Kernel",
            "language": "cuda",
            "code": """__global__ void matrixMul(float *A, float *B, float *C, int N) {
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;
    
    if (row < N && col < N) {
        float sum = 0.0f;
        for (int k = 0; k < N; k++) {
            // Uncoalesced memory access!
            sum += A[row * N + k] * B[k * N + col];
        }
        C[row * N + col] = sum;
    }
}"""
        },
        "python_gpu": {
            "name": "Python GPU Computing (PyTorch)",
            "language": "python",
            "code": """import torch

def inefficient_matmul(A, B):
    # Moving between CPU and GPU repeatedly
    result = torch.zeros(A.shape[0], B.shape[1])
    for i in range(A.shape[0]):
        for j in range(B.shape[1]):
            result[i, j] = torch.sum(A[i, :].cpu() * B[:, j].cpu())
            result = result.cuda()
    return result

# No batch processing
def process_images(images):
    results = []
    for img in images:
        img_gpu = img.cuda()
        processed = some_model(img_gpu)
        results.append(processed.cpu())
    return results"""
        },
        "numpy_vectorization": {
            "name": "NumPy Vectorization Opportunity",
            "language": "python",
            "code": """import numpy as np

def slow_computation(data):
    result = np.zeros_like(data)
    # Inefficient loop instead of vectorization
    for i in range(data.shape[0]):
        for j in range(data.shape[1]):
            result[i, j] = np.sin(data[i, j]) * np.cos(data[i, j])
    return result

# Could be GPU-accelerated with CuPy
def matrix_operations(A, B):
    result = []
    for i in range(len(A)):
        result.append(A[i] @ B[i])
    return np.array(result)"""
        }
    }
    return examples


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
