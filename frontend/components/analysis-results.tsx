"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AnalysisResult } from "@/lib/types";
import { Zap, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

interface AnalysisResultsProps {
  result: AnalysisResult | null;
  loading?: boolean;
}

const severityColors = {
  critical: "destructive",
  high: "default",
  medium: "secondary",
  low: "outline",
} as const;

const scoreColor = (score: number) => {
  if (score >= 90) return "text-primary";
  if (score >= 75) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  return "text-destructive";
};

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result, loading }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Analyzing your GPU code...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="h-full bg-gradient-to-br from-card to-card/50">
        <CardContent className="flex items-center justify-center h-full p-12">
          <div className="text-center space-y-6 max-w-md">
            <div className="inline-flex p-4 rounded-2xl bg-primary/10">
              <Zap className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">Ready to Optimize</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Paste your GPU code and click <strong>Analyze</strong> to get AI-powered optimization suggestions
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4">
              {[
                { icon: "M", label: "Memory Optimization" },
                { icon: "K", label: "Kernel Analysis" },
                { icon: "T", label: "Tensor Core Usage" },
                { icon: "P", label: "Parallel Efficiency" },
              ].map((feature) => (
                <div
                  key={feature.label}
                  className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {feature.icon}
                  </div>
                  <span className="text-xs font-medium">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-full">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6 p-6"
      >
        {/* Summary Card */}
        <motion.div variants={cardVariants}>
          <Card className="border-primary/20 shadow-lg shadow-primary/5">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle>Analysis Summary</CardTitle>
                  <CardDescription className="text-xs">
                    Model: {result.model_used}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className={cn("text-4xl font-bold tabular-nums", scoreColor(result.overall_score))}
                  >
                    {result.overall_score}
                    <span className="text-lg text-muted-foreground">/100</span>
                  </motion.div>
                  <Badge variant="secondary" className="text-xs">
                    {result.optimizations.length} {result.optimizations.length === 1 ? "Issue" : "Issues"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* No issues */}
        {result.optimizations.length === 0 && (
          <motion.div variants={cardVariants}>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                >
                  <Check className="w-16 h-16 text-primary mb-4" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">Excellent Work!</h3>
                <p className="text-sm text-muted-foreground">No major optimization issues found in your code.</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Optimization Cards */}
        {result.optimizations.map((opt, index) => (
          <motion.div
            key={index}
            variants={cardVariants}
            whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
          >
            <Card className="hover:border-primary/30 transition-colors shadow-md shadow-black/5 hover:shadow-lg hover:shadow-black/10">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={severityColors[opt.severity as keyof typeof severityColors]}>
                        {opt.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {opt.category.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{opt.issue}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{opt.suggestion}</p>

                {opt.code_snippet && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Optimized Code</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => copyToClipboard(opt.code_snippet!, index)}
                        >
                          <AnimatePresence mode="wait">
                            {copiedIndex === index ? (
                              <motion.span
                                key="copied"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Copied
                              </motion.span>
                            ) : (
                              <motion.span
                                key="copy"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </Button>
                      </div>
                      <pre className="text-xs leading-relaxed p-4 rounded-lg bg-muted/30 overflow-x-auto font-mono">
                        <code>{opt.code_snippet}</code>
                      </pre>
                    </div>
                  </>
                )}

                {opt.estimated_speedup && (
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">
                      Estimated Speedup: <strong className="text-primary">{opt.estimated_speedup}</strong>
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </ScrollArea>
  );
};
