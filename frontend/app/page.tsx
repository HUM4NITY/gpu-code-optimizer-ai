"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/logo";
import { CodeEditor } from "@/components/code-editor";
import { AnalysisResults } from "@/components/analysis-results";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { AnalysisResult, Example } from "@/lib/types";
import { cn } from "@/lib/utils";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Home() {
  // State
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<"python" | "cuda" | "cpp">("python");
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<boolean>(false);
  const [examples, setExamples] = useState<Record<string, Example>>({});
  const [showExamples, setShowExamples] = useState(false);

  // Load models, examples, and check health on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const [modelsData, healthData, examplesData] = await Promise.all([
          apiClient.getModels(),
          apiClient.healthCheck(),
          apiClient.getExamples(),
        ]);
        
        setModels(modelsData);
        if (modelsData.length > 0) {
          const nemotron = modelsData.find((m) => m.toLowerCase().includes("nemotron"));
          setSelectedModel(nemotron || modelsData[0]);
        }
        setOllamaStatus(healthData.ollama_available);
        setExamples(examplesData);
      } catch (err) {
        console.error("Failed to initialize:", err);
        setError("Failed to connect to API");
      }
    };

    initialize();
  }, []);

  // Handle analysis
  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError("Please enter some code to analyze");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.analyzeCode({
        code,
        language,
        model: selectedModel,
      });
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  // Load example
  const loadExample = (example: Example) => {
    setCode(example.code);
    setLanguage(example.language as "python" | "cuda" | "cpp");
    setShowExamples(false);
    setAnalysisResult(null);
    setError(null);
  };

  // Handle clear
  const handleClear = () => {
    setCode("");
    setAnalysisResult(null);
    setError(null);
  };

  // Code stats
  const lines = code.split("\n").length;
  const chars = code.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-40" />
      <div className="fixed inset-0 bg-gradient-radial" />

      {/* Main Container */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-black/5">
          <div className="container mx-auto px-6 h-20 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-6"
            >
              <Logo className="h-8" />
              <div className="hidden md:flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  ollamaStatus ? "bg-primary animate-pulse" : "bg-destructive"
                )} />
                <span className="text-xs font-medium text-muted-foreground">
                  {ollamaStatus ? "Connected" : "Disconnected"}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <Select value={language} onValueChange={(v) => setLanguage(v as "python" | "cuda" | "cpp")}>
                <SelectTrigger className="w-32 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="cuda">CUDA</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                </SelectContent>
              </Select>

              {models.length > 0 && (
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-48 h-10 hidden lg:flex">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </motion.div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16 max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent">
              GPU Code Analysis
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed">
              AI-powered optimization insights for CUDA, Python, and C++ code using NVIDIA Nemotron
            </p>
          </motion.div>

          {/* Error Alert */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-8 max-w-4xl mx-auto"
              >
                <Card className="p-5 border-destructive/50 bg-destructive/10">
                  <div className="flex items-start gap-4">
                    <div className="w-5 h-5 rounded-full border-2 border-destructive flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-destructive font-bold">!</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">{error}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-[1800px] mx-auto"
          >
            {/* Editor Section */}
            <motion.div variants={fadeInUp} className="space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-2">Code Editor</h2>
                  <p className="text-sm text-muted-foreground">
                    {lines.toLocaleString()} {lines === 1 ? "line" : "lines"} • {chars.toLocaleString()} characters
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Dialog open={showExamples} onOpenChange={setShowExamples}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9">
                        Examples
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto overflow-x-hidden">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Code Examples</DialogTitle>
                        <DialogDescription className="text-base">
                          Choose from sample GPU code to test the analyzer
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 mt-6">
                        {Object.entries(examples).map(([key, example]) => (
                          <motion.button
                            key={key}
                            onClick={() => loadExample(example)}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="text-left p-6 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-accent/50 transition-all"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-lg font-semibold">{example.name}</h3>
                              <Badge variant="secondary" className="text-xs font-mono">
                                {example.language.toUpperCase()}
                              </Badge>
                            </div>
                            <pre className="text-xs text-muted-foreground font-mono leading-relaxed overflow-hidden whitespace-pre-wrap break-all line-clamp-3">
                              {example.code}
                            </pre>
                          </motion.button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    disabled={!code}
                    className="h-9"
                  >
                    Clear
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.readText().then(setCode)}
                    className="h-9"
                  >
                    Paste
                  </Button>
                </div>
              </div>

              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
                className="h-[700px]"
              />

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  className="w-full h-14 text-lg font-semibold"
                  onClick={handleAnalyze}
                  disabled={loading || !code.trim() || !ollamaStatus}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 mr-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing Code...
                    </>
                  ) : (
                    "Analyze Code"
                  )}
                </Button>
              </motion.div>

              {!ollamaStatus && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-center text-destructive font-medium"
                >
                  Ollama is not available. Please ensure it is running.
                </motion.p>
              )}
            </motion.div>

            {/* Results Section */}
            <motion.div variants={fadeInUp} className="space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-2">Analysis Results</h2>
                  <p className="text-sm text-muted-foreground">
                    Optimization recommendations powered by NVIDIA Nemotron
                  </p>
                </div>
                <AnimatePresence>
                  {analysisResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Badge variant="outline" className="text-sm font-medium px-3 py-1">
                        {analysisResult.optimizations.length} {analysisResult.optimizations.length === 1 ? "Issue" : "Issues"}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-[700px] overflow-hidden rounded-2xl border border-border shadow-2xl shadow-black/20 bg-card">
                <AnalysisResults result={analysisResult} loading={loading} />
              </div>
            </motion.div>
          </motion.div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-20 text-center space-y-3"
          >
            <p className="text-sm text-muted-foreground">
              Powered by <strong className="text-primary font-semibold">NVIDIA Nemotron</strong> via Ollama
            </p>
            <p className="text-xs text-muted-foreground/60 max-w-2xl mx-auto leading-relaxed">
              Analyzes GPU code for memory coalescing, kernel fusion, tensor core utilization, occupancy, bandwidth optimization, and parallelism efficiency
            </p>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
