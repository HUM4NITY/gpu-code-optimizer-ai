"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  className?: string;
}

export const CodeEditor = React.forwardRef<HTMLTextAreaElement, CodeEditorProps>(
  ({ value, onChange, language = "python", placeholder, className }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    // Sync scroll between textarea and line numbers
    useEffect(() => {
      const textarea = textareaRef.current;
      const lineNumbers = lineNumbersRef.current;

      if (!textarea || !lineNumbers) return;

      const syncScroll = () => {
        lineNumbers.scrollTop = textarea.scrollTop;
      };

      textarea.addEventListener("scroll", syncScroll);
      return () => textarea.removeEventListener("scroll", syncScroll);
    }, []);

    // Calculate line numbers
    const lines = value.split("\n").length;
    const lineNumbersArray = Array.from({ length: Math.max(lines, 20) }, (_, i) => i + 1);

    return (
      <div className={cn("relative flex rounded-xl overflow-hidden border border-border bg-card shadow-lg shadow-black/10", className)}>
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 w-12 bg-muted/30 text-muted-foreground text-xs font-mono leading-6 text-right pr-3 pt-4 select-none overflow-hidden"
          style={{ lineHeight: "1.5rem" }}
        >
          {lineNumbersArray.map((lineNum) => (
            <div key={lineNum} className="h-6">
              {lineNum}
            </div>
          ))}
        </div>

        {/* Code textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Paste your ${language.toUpperCase()} code here...`}
          className={cn(
            "flex-1 bg-transparent text-foreground font-mono text-sm leading-6 p-4",
            "resize-none outline-none",
            "placeholder:text-muted-foreground/50",
            "min-h-[400px]"
          )}
          spellCheck={false}
          style={{
            lineHeight: "1.5rem",
            tabSize: 4,
          }}
        />
      </div>
    );
  }
);

CodeEditor.displayName = "CodeEditor";
