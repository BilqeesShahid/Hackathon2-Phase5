/**
 * Enhanced Task Message Renderer Component
 *
 * Custom renderer for advanced task lists in chat messages.
 * Detects and formats task list messages with priority badges, due dates, tags, and recurrence indicators.
 *
 * Constitution Compliance:
 * - Stateless UI component (§6.1)
 */

'use client';

import React from 'react';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  priority?: string; // high, medium, low
  due_date?: string; // ISO date string
  tags?: string[];
  recurrence?: string; // daily, weekly, monthly, custom
  description?: string;
}

interface TaskMessageRendererProps {
  content: string;
}

/**
 * Parse advanced task list from backend response
 *
 * Expected formats include:
 * - Priority indicators: 🔴 high, 🟡 medium, 🟢 low
 * - Due date indicators: ⏰ YYYY-MM-DD
 * - Tag indicators: [tag1] [tag2]
 * - Recurrence indicators: 🔄 daily/weekly/monthly
 */
function parseAdvancedTaskList(content: string): Task[] | null {
  // Check if this is a task list message
  if (!content.includes('Here are your') && !content.includes('tasks') && !content.includes('📋')) {
    return null;
  }

  const tasks: Task[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Match patterns like "  1. Title 🟡 ⏰ 2026-02-05 [work] 🔄 weekly"
    // or "  ~~2. Completed task~~"

    // First, check if it's a completed task with strikethrough
    if (line.includes('~~') && line.includes('.')) {
      const completedMatch = line.match(/~~(\d+)\.\s*(.*?)~~/);
      if (completedMatch) {
        const id = parseInt(completedMatch[1]);
        const title = completedMatch[2].trim();

        // Extract additional info from the completed task line
        const task: Task = {
          id,
          title,
          completed: true,
        };

        tasks.push(task);
      }
    } else {
      // Match pending tasks
      const match = line.match(/^\s*(\d+)\.\s*(.+?)(?:\s+(\[[^\]]+\]))?(?:\s+([🔴🟡🟢]))?(?:\s+(⏰[^[]*))?(?:\s+(🔄[^[]*))?$/);
      if (match) {
        const id = parseInt(match[1]);
        let title = match[2].trim();

        // Extract priority from emojis if present
        let priority: string | undefined;
        if (match[4]) {
          const priorityMap: Record<string, string> = {
            '🔴': 'high',
            '🟡': 'medium',
            '🟢': 'low',
          };
          priority = priorityMap[match[4]];
        }

        // Extract due date if present
        let dueDate: string | undefined;
        if (match[5]) {
          const dateMatch = match[5].match(/⏰\s*(.+)/);
          if (dateMatch) {
            dueDate = dateMatch[1].trim();
          }
        }

        // Extract tags if present
        let tags: string[] | undefined;
        if (match[3]) {
          const tagMatch = match[3].match(/\[([^\]]+)\]/g);
          if (tagMatch) {
            tags = tagMatch.map(tag => tag.slice(1, -1)); // Remove brackets
          }
        }

        // Extract recurrence if present
        let recurrence: string | undefined;
        if (match[6]) {
          const recurrenceMatch = match[6].match(/🔄\s*(.+)/);
          if (recurrenceMatch) {
            recurrence = recurrenceMatch[1].trim();
          }
        }

        const task: Task = {
          id,
          title,
          completed: false,
          priority,
          due_date: dueDate,
          tags,
          recurrence,
        };

        tasks.push(task);
      } else {
        // More comprehensive matching for complex lines
        const complexMatch = line.match(/^\s*(\d+)\.\s*(.+?)(?:\s+([🔴🟡🟢]))?(?:\s+⏰\s*([^[]+))?(?:\s+(\[[^\]]+\]))?(?:\s+🔄\s*(.+))?$/);
        if (complexMatch) {
          const id = parseInt(complexMatch[1]);
          let title = complexMatch[2].trim();

          // Extract priority
          let priority: string | undefined;
          if (complexMatch[3]) {
            const priorityMap: Record<string, string> = {
              '🔴': 'high',
              '🟡': 'medium',
              '🟢': 'low',
            };
            priority = priorityMap[complexMatch[3]];
          }

          // Extract due date
          let dueDate: string | undefined;
          if (complexMatch[4]) {
            dueDate = complexMatch[4].trim();
          }

          // Extract tags
          let tags: string[] | undefined;
          if (complexMatch[5]) {
            tags = [complexMatch[5].slice(1, -1)]; // Remove brackets from single tag
          }

          // Extract recurrence
          let recurrence: string | undefined;
          if (complexMatch[6]) {
            recurrence = complexMatch[6].trim();
          }

          const task: Task = {
            id,
            title,
            completed: false,
            priority,
            due_date: dueDate,
            tags,
            recurrence,
          };

          tasks.push(task);
        }
      }
    }
  }

  return tasks.length > 0 ? tasks : null;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch {
    return dateString; // Return original if parsing fails
  }
}

export default function TaskMessageRenderer({ content }: TaskMessageRendererProps) {
  const tasks = parseAdvancedTaskList(content);

  // If not an advanced task list, fall back to the original rendering
  if (!tasks) {
    // For now, just render as plain text
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  // Extract header (first line before tasks)
  const lines = content.split('\n');
  const header = lines[0] || 'Your tasks:';

  // Group tasks by completion status
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="font-medium text-gray-700">{header}</div>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
            <span>⏳</span> Pending ({pendingTasks.length})
          </div>
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium">
                    {task.id}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 text-sm text-gray-800 font-medium">
                        {task.title}
                      </div>

                      {/* Priority Badge */}
                      {task.priority && (
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority.toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Description if available */}
                    {task.description && (
                      <div className="text-xs text-gray-600 mt-1 ml-6">
                        {task.description}
                      </div>
                    )}

                    {/* Due Date, Tags, Recurrence Info */}
                    <div className="flex flex-wrap gap-2 mt-2 ml-6">
                      {task.due_date && (
                        <div className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full flex items-center gap-1">
                          <span>⏰</span> {formatDate(task.due_date)}
                        </div>
                      )}

                      {task.tags && task.tags.map((tag, idx) => (
                        <div key={idx} className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                          #{tag}
                        </div>
                      ))}

                      {task.recurrence && (
                        <div className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full flex items-center gap-1">
                          <span>🔄</span> {task.recurrence}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
            <span>✅</span> Completed ({completedTasks.length})
          </div>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg opacity-75 border border-gray-200"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-medium">
                  ✓
                </div>
                <div className="flex-1 text-sm text-gray-500 line-through">
                  {task.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="text-sm text-gray-500 italic">
          No tasks found. Add one to get started!
        </div>
      )}
    </div>
  );
}
