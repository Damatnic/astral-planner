'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QuickCapture } from '@/components/quick-capture/QuickCapture';
import { useToast } from '@/hooks/use-toast';
import { Zap } from 'lucide-react';

interface QuickAddProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAdd({ open, onOpenChange }: QuickAddProps) {
  const { toast } = useToast();

  const handleSubmit = async (input: string, type: string) => {
    try {
      // Parse the input with AI if it's natural language (not a command)
      let parsedData = null;
      if (!input.startsWith('/')) {
        try {
          const parseResponse = await fetch('/api/ai/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input, preview: false }),
          });
          
          if (parseResponse.ok) {
            const parseResult = await parseResponse.json();
            parsedData = parseResult.parsed;
          }
        } catch (error) {
          // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.warn('AI parsing failed, using basic parsing:', error);
        }
      }

      // Prepare the data for creation
      const itemData = {
        title: parsedData?.title || input,
        type: parsedData?.type || type,
        description: parsedData?.description,
        priority: parsedData?.priority || 'medium',
        dueDate: parsedData?.dueDate,
        estimatedDuration: parsedData?.estimatedDuration || parsedData?.duration,
        tags: parsedData?.tags || [],
        category: parsedData?.category
      };

      // Create the item via API
      const response = await fetch('/api/tasks/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create item');
      }

      const result = await response.json();
      
      // Close the dialog
      onOpenChange(false);
      
      // Show success message
      toast({
        title: result.message || 'Item Created',
        description: `"${itemData.title}" has been added to your planner.`,
      });

      // Refresh the page data (you might want to use a more sophisticated state management)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('quickItemCreated', { 
          detail: { item: result.item, type: itemData.type } 
        }));
      }

    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Quick add error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create item. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Add
          </DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <QuickCapture
            onSubmit={handleSubmit}
            placeholder="Type naturally or use commands like /task, /event, /goal..."
            showSuggestions={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QuickAdd;