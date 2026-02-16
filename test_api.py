import requests
import json

# Test the API with a simple inefficient code example
test_code = """
import torch

def process_batch(data):
    results = []
    for item in data:
        item_gpu = item.cuda()
        result = model(item_gpu)
        results.append(result.cpu())
    return results
"""

print("Testing GPU Code Optimizer AI...")
print("=" * 60)

# Test analyze endpoint
response = requests.post(
    "http://localhost:8000/api/analyze",
    json={
        "code": test_code,
        "language": "python",
        "model": "nemotron-mini"
    }
)

print(f"\nStatus Code: {response.status_code}")

if response.status_code == 200:
    result = response.json()
    print(f"\n✅ Analysis Complete!")
    print(f"Overall Score: {result['overall_score']}/100")
    print(f"Model Used: {result['model_used']}")
    print(f"Summary: {result['summary']}")
    print(f"\nOptimizations Found: {len(result['optimizations'])}")
    
    for i, opt in enumerate(result['optimizations'], 1):
        print(f"\n{i}. [{opt['severity'].upper()}] {opt['category']}")
        print(f"   Issue: {opt['issue']}")
        print(f"   Suggestion: {opt['suggestion'][:100]}...")
else:
    print(f"\n❌ Error: {response.text}")
