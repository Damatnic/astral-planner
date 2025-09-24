'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCollaboration } from './CollaborationProvider';

interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  userName: string;
  userColor: string;
}

export function CursorOverlay({ className }: { className?: string }) {
  const { collaborators } = useCollaboration();
  const [cursors, setCursors] = useState<CursorPosition[]>([]);

  useEffect(() => {
    const activeCursors = collaborators
      .filter(user => user.cursor && user.cursor.x >= 0 && user.cursor.y >= 0)
      .map(user => ({
        x: user.cursor!.x,
        y: user.cursor!.y,
        userId: user.id,
        userName: user.name,
        userColor: user.color,
      }));
    
    setCursors(activeCursors);
  }, [collaborators]);

  return (
    <div className={cn("fixed inset-0 pointer-events-none z-40", className)}>
      <AnimatePresence>
        {cursors.map((cursor) => (
          <motion.div
            key={cursor.userId}
            className="absolute"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: cursor.x,
              y: cursor.y,
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 28,
              mass: 0.5
            }}
          >
            <CollaboratorCursor
              name={cursor.userName}
              color={cursor.userColor}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface CollaboratorCursorProps {
  name: string;
  color: string;
}

function CollaboratorCursor({ name, color }: CollaboratorCursorProps) {
  return (
    <div className="relative">
      {/* Cursor pointer */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="drop-shadow-sm"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      
      {/* Name label */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: -10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        className="absolute top-5 left-1 pointer-events-none"
      >
        <div
          className="px-2 py-1 rounded text-white text-xs font-medium shadow-lg whitespace-nowrap"
          style={{ backgroundColor: color }}
        >
          {name}
          <div
            className="absolute -top-1 left-2 w-2 h-2 rotate-45"
            style={{ backgroundColor: color }}
          />
        </div>
      </motion.div>
    </div>
  );
}

export function SelectionOverlay({ className }: { className?: string }) {
  const { collaborators } = useCollaboration();
  const [selections, setSelections] = useState<Array<{
    userId: string;
    userName: string;
    userColor: string;
    start: number;
    end: number;
  }>>([]);

  useEffect(() => {
    const activeSelections = collaborators
      .filter(user => user.selection && user.selection.start !== user.selection.end)
      .map(user => ({
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        start: user.selection!.start,
        end: user.selection!.end,
      }));
    
    setSelections(activeSelections);
  }, [collaborators]);

  if (selections.length === 0) return null;

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {selections.map((selection) => (
        <motion.div
          key={selection.userId}
          className="absolute rounded-sm opacity-30"
          style={{ 
            backgroundColor: selection.userColor,
            // Position and size would be calculated based on text selection
            // This is a simplified representation
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
        />
      ))}
    </div>
  );
}

export function TypingIndicator({ className }: { className?: string }) {
  const { collaborators } = useCollaboration();
  const typingUsers = collaborators.filter(user => user.isTyping);

  if (typingUsers.length === 0) return null;

  return (
    <motion.div
      className={cn("flex items-center space-x-2 text-sm text-muted-foreground", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <div className="flex -space-x-1">
        {typingUsers.slice(0, 3).map((user) => (
          <div
            key={user.id}
            className="w-4 h-4 rounded-full border-2 border-background"
            style={{ backgroundColor: user.color }}
          />
        ))}
      </div>
      
      <span>
        {typingUsers.length === 1
          ? `${typingUsers[0].name} is typing...`
          : typingUsers.length === 2
          ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`
          : `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing...`
        }
      </span>
      
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-current rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}