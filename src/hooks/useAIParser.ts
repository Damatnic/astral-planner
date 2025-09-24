'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ParsedInput } from '@/lib/ai/parser';

export function useAIParser() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const parseInputMutation = useMutation({
    mutationFn: async ({ input, options }: { 
      input: string; 
      options?: { preview?: boolean; context?: any } 
    }) => {
      const response = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, ...options }),
      });
      
      if (!response.ok) throw new Error('Failed to parse input');
      return response.json();
    },
    onError: (error) => {
      console.error('AI parsing error:', error);
      if (!options?.preview) {
        toast.error('Failed to parse input. Using basic parsing.');
      }
    }
  });

  const getSuggestionsMutation = useMutation({
    mutationFn: async (partialInput: string) => {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: partialInput }),
      });
      
      if (!response.ok) throw new Error('Failed to get suggestions');
      return response.json();
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions || []);
    },
    onError: (error) => {
      console.error('Failed to get AI suggestions:', error);
      setSuggestions([]);
    }
  });

  const generateScheduleMutation = useMutation({
    mutationFn: async ({ tasks, preferences }: { 
      tasks: any[]; 
      preferences: any 
    }) => {
      const response = await fetch('/api/ai/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, preferences }),
      });
      
      if (!response.ok) throw new Error('Failed to generate schedule');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Smart schedule generated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to generate schedule');
      console.error('Schedule generation error:', error);
    }
  });

  const analyzeProductivityMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to analyze productivity');
      return response.json();
    },
    onError: (error) => {
      toast.error('Failed to analyze productivity');
      console.error('Productivity analysis error:', error);
    }
  });

  const parseInput = useCallback(
    async (input: string, options?: { preview?: boolean; context?: any }): Promise<ParsedInput | string | null> => {
      if (options?.preview) {
        // For preview mode, return suggestion string
        const result = await parseInputMutation.mutateAsync({ input, options });
        return result.suggestion || null;
      } else {
        // For full parsing, return parsed object
        const result = await parseInputMutation.mutateAsync({ input, options });
        return result.parsed || null;
      }
    },
    [parseInputMutation]
  );

  const getSuggestions = useCallback(
    async (partialInput: string) => {
      if (partialInput.length < 3) {
        setSuggestions([]);
        return;
      }
      await getSuggestionsMutation.mutateAsync(partialInput);
    },
    [getSuggestionsMutation]
  );

  const generateSchedule = useCallback(
    async (tasks: any[], preferences: any) => {
      const result = await generateScheduleMutation.mutateAsync({ tasks, preferences });
      return result.schedule || [];
    },
    [generateScheduleMutation]
  );

  const analyzeProductivity = useCallback(
    async (data: any) => {
      const result = await analyzeProductivityMutation.mutateAsync(data);
      return result;
    },
    [analyzeProductivityMutation]
  );

  return {
    parseInput,
    getSuggestions,
    generateSchedule,
    analyzeProductivity,
    suggestions,
    isLoading: parseInputMutation.isPending || 
               getSuggestionsMutation.isPending || 
               generateScheduleMutation.isPending ||
               analyzeProductivityMutation.isPending,
    isParsing: parseInputMutation.isPending,
    isGenerating: generateScheduleMutation.isPending,
    isAnalyzing: analyzeProductivityMutation.isPending,
  };
}