"use client";

import { useState } from "react";
import { TaskResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { TaskService } from "../services/taskService";

interface TaskItemProps {
  task: TaskResponse;
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
}

export function TaskItem({ task, onTaskUpdated, onTaskDeleted }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || "");
  const [editPriority, setEditPriority] = useState(task.priority || "medium");
  const [editDueDate, setEditDueDate] = useState(task.due_date || "");
  const [editTags, setEditTags] = useState(task.tags?.join(", ") || "");
  const [editRecurrence, setEditRecurrence] = useState(task.recurrence || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { session } = useAuth();

  const token = (session as any)?.token || "";

  async function handleToggleComplete() {
    setIsLoading(true);
    try {
      await TaskService.toggleComplete(task.user_id, task.id, token);
      onTaskUpdated();
    } catch (err) {
      console.error("Failed to toggle completion:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    setIsLoading(true);
    try {
      // Parse tags from comma-separated string
      const tags = editTags ? editTags.split(",").map(tag => tag.trim()).filter(tag => tag) : [];

      await TaskService.updateTask(task.user_id, task.id, {
        title: editTitle,
        description: editDescription || undefined,
        priority: editPriority,
        due_date: editDueDate || undefined,
        tags: tags.length > 0 ? tags : undefined,
        recurrence: editRecurrence || undefined,
      }, token);
      setIsEditing(false);
      onTaskUpdated();
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setIsLoading(true);
    try {
      await TaskService.deleteTask(task.user_id, task.id, token);
      onTaskDeleted();
    } catch (err) {
      console.error("Failed to delete task:", err);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 mb-3 border border-purple-100">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Task title"
        />
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Description (optional)"
        />

        {/* Advanced Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

          <input
            type="date"
            value={editDueDate.split('T')[0] || ""}
            onChange={(e) => setEditDueDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Due date"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
          <input
            type="text"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Tags (comma separated)"
          />

          <select
            value={editRecurrence}
            onChange={(e) => setEditRecurrence(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">No recurrence</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (showDeleteConfirm) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 mb-3 border border-red-200">
        <p className="text-gray-700 mb-4">Are you sure you want to delete this task?</p>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
          >
            Yes, Delete
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-md p-4 mb-3 transition-all hover:shadow-lg ${task.completed ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggleComplete}
          disabled={isLoading}
          className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-purple-500"}`}
        >
          {task.completed && (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold flex-shrink-0">
              #{task.id}
            </span>
            <h3
              className={`text-lg font-medium truncate ${task.completed ? "line-through text-gray-400" : "text-gray-800"}`}
            >
              {task.title}
            </h3>

            {/* Priority Indicator */}
            {task.priority && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {task.priority.toUpperCase()}
              </span>
            )}
          </div>

          {task.description && (
            <p className={`text-sm mt-1 ${task.completed ? "text-gray-400" : "text-gray-600"}`}>
              {task.description}
            </p>
          )}

          {/* Advanced Features Display */}
          <div className="flex flex-wrap gap-2 mt-2">
            {task.due_date && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                <span>⏰</span> {formatDate(task.due_date)}
              </span>
            )}

            {task.tags && task.tags.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                {task.tags.map((tag, idx) => (
                  <span key={idx}>#{tag}</span>
                ))}
              </span>
            )}

            {task.recurrence && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                <span>🔄</span> {task.recurrence}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Created: {new Date(task.created_at).toLocaleDateString()}
            {task.updated_at !== task.created_at && ` • Updated: ${new Date(task.updated_at).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
