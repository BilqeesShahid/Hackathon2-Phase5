"use client";

import { TaskResponse } from "@/lib/api";
import { TaskItem } from "./TaskItem";

type TaskFilter = 'all' | 'pending' | 'completed' | 'high-priority' | 'medium-priority' | 'low-priority' | 'recurring' | 'due-soon';

interface TaskListProps {
  tasks: TaskResponse[];
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
  activeFilter?: TaskFilter;
  onFilterChange?: (filter: TaskFilter) => void;
}

export function TaskList({ tasks, onTaskUpdated, onTaskDeleted, activeFilter = 'all', onFilterChange }: TaskListProps) {
  // Apply active filter
  const filteredTasks = (() => {
    switch (activeFilter) {
      case 'pending':
        return tasks.filter(t => !t.completed);
      case 'completed':
        return tasks.filter(t => t.completed);
      case 'high-priority':
        return tasks.filter(t => t.priority === 'high');
      case 'medium-priority':
        return tasks.filter(t => t.priority === 'medium');
      case 'low-priority':
        return tasks.filter(t => t.priority === 'low' || !t.priority);
      case 'recurring':
        return tasks.filter(t => t.recurrence && t.recurrence !== null);
      case 'due-soon':
        // Filter tasks due within 24 hours
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return tasks.filter(t => {
          if (!t.due_date || t.completed) return false;
          try {
            const dueDate = new Date(t.due_date);
            return dueDate >= now && dueDate <= tomorrow;
          } catch {
            return false;
          }
        });
      default:
        return tasks;
    }
  })();

  // Group tasks by completion status (using filtered tasks)
  const completedTasks = filteredTasks.filter(t => t.completed);
  const pendingTasks = filteredTasks.filter(t => !t.completed);

  // Calculate stats
  const completedCount = completedTasks.length;
  const pendingCount = pendingTasks.length;

  // Group pending tasks by priority
  const highPriorityTasks = pendingTasks.filter(t => t.priority === 'high');
  const mediumPriorityTasks = pendingTasks.filter(t => t.priority === 'medium');
  const lowPriorityTasks = pendingTasks.filter(t => t.priority === 'low' || !t.priority);

  // Group recurring tasks (tasks with recurrence field set)
  const recurringTasks = pendingTasks.filter(t => t.recurrence && t.recurrence !== null);

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No tasks yet</h3>
        <p className="text-gray-500">Add your first task above to get started!</p>
      </div>
    );
  }

  return (
    <div>
      {/* Show message when active filter yields no results */}
      {filteredTasks.length === 0 && activeFilter !== 'all' && (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No tasks found</h3>
          <p className="text-gray-500">There are no {activeFilter.replace('-', ' ')} tasks.</p>
          <button
            onClick={() => onFilterChange && onFilterChange('all')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            View All Tasks
          </button>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => onFilterChange && onFilterChange('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === 'all'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
              : 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 hover:from-purple-200 hover:to-indigo-200 shadow'
          }`}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => onFilterChange && onFilterChange('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === 'pending'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
              : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 hover:from-blue-200 hover:to-cyan-200 shadow'
          }`}
        >
          Pending ({tasks.filter(t => !t.completed).length})
        </button>
        <button
          onClick={() => onFilterChange && onFilterChange('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === 'completed'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
              : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 hover:from-green-200 hover:to-emerald-200 shadow'
          }`}
        >
          Completed ({tasks.filter(t => t.completed).length})
        </button>
        <button
          onClick={() => onFilterChange && onFilterChange('high-priority')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === 'high-priority'
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg'
              : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 hover:from-red-200 hover:to-rose-200 shadow'
          }`}
        >
          High Priority ({tasks.filter(t => t.priority === 'high').length})
        </button>
        <button
          onClick={() => onFilterChange && onFilterChange('medium-priority')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === 'medium-priority'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
              : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 hover:from-amber-200 hover:to-orange-200 shadow'
          }`}
        >
          Medium Priority ({tasks.filter(t => t.priority === 'medium').length})
        </button>
        <button
          onClick={() => onFilterChange && onFilterChange('low-priority')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === 'low-priority'
              ? 'bg-gradient-to-r from-lime-500 to-green-500 text-white shadow-lg'
              : 'bg-gradient-to-r from-lime-100 to-green-100 text-lime-800 hover:from-lime-200 hover:to-green-200 shadow'
          }`}
        >
          Low Priority ({tasks.filter(t => t.priority === 'low' || !t.priority).length})
        </button>
        <button
          onClick={() => onFilterChange && onFilterChange('recurring')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === 'recurring'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 hover:from-indigo-200 hover:to-purple-200 shadow'
          }`}
        >
          Recurring ({tasks.filter(t => t.recurrence && t.recurrence !== null).length})
        </button>
        <button
          onClick={() => onFilterChange && onFilterChange('due-soon')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === 'due-soon'
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg'
              : 'bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-800 hover:from-violet-200 hover:to-fuchsia-200 shadow'
          }`}
        >
          Due Soon ({tasks.filter(t => {
            if (!t.due_date || t.completed) return false;
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            try {
              const dueDate = new Date(t.due_date);
              return dueDate >= now && dueDate <= tomorrow;
            } catch {
              return false;
            }
          }).length})
        </button>
      </div>


      {/* Show all tasks when in 'all' filter mode */}
      {activeFilter === 'all' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>📋</span> All Tasks ({tasks.length})
          </h2>

          {/* High Priority Tasks */}
          {highPriorityTasks.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100">
              <h3 className="text-lg font-medium text-red-700 mb-2 flex items-center gap-2">
                <span>🔴</span> High Priority ({highPriorityTasks.length})
              </h3>
              <div className="space-y-2">
                {highPriorityTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onTaskUpdated={onTaskUpdated}
                    onTaskDeleted={onTaskDeleted}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recurring Tasks */}
          {recurringTasks.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
              <h3 className="text-lg font-medium text-blue-700 mb-2 flex items-center gap-2">
                <span>🔄</span> Recurring Tasks ({recurringTasks.length})
              </h3>
              <div className="space-y-2">
                {recurringTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onTaskUpdated={onTaskUpdated}
                    onTaskDeleted={onTaskDeleted}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Medium Priority Tasks */}
          {mediumPriorityTasks.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100">
              <h3 className="text-lg font-medium text-amber-700 mb-2 flex items-center gap-2">
                <span>🟡</span> Medium Priority ({mediumPriorityTasks.length})
              </h3>
              <div className="space-y-2">
                {mediumPriorityTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onTaskUpdated={onTaskUpdated}
                    onTaskDeleted={onTaskDeleted}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Low Priority Tasks */}
          {lowPriorityTasks.length > 0 && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
              <h3 className="text-lg font-medium text-green-700 mb-2 flex items-center gap-2">
                <span>🟢</span> Low Priority ({lowPriorityTasks.length})
              </h3>
              <div className="space-y-2">
                {lowPriorityTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onTaskUpdated={onTaskUpdated}
                    onTaskDeleted={onTaskDeleted}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show only pending tasks when in 'pending' filter mode */}
      {activeFilter === 'pending' && pendingTasks.length > 0 && (
        <div className="mb-8 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
          <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center gap-2">
            <span>⏳</span> Pending Tasks ({pendingCount})
          </h2>
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onTaskUpdated={onTaskUpdated}
                onTaskDeleted={onTaskDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* High Priority Tasks Section - Show only when in high-priority filter mode */}
      {activeFilter === 'high-priority' && (
        <div className="mb-8 p-4 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100">
          <h2 className="text-xl font-semibold text-red-700 mb-4 flex items-center gap-2">
            <span>🔴</span> High Priority Tasks ({highPriorityTasks.length})
          </h2>
          <div className="space-y-2">
            {highPriorityTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onTaskUpdated={onTaskUpdated}
                onTaskDeleted={onTaskDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority Tasks Section - Show only when in medium-priority filter mode */}
      {activeFilter === 'medium-priority' && (
        <div className="mb-8 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100">
          <h2 className="text-xl font-semibold text-amber-700 mb-4 flex items-center gap-2">
            <span>🟡</span> Medium Priority Tasks ({mediumPriorityTasks.length})
          </h2>
          <div className="space-y-2">
            {mediumPriorityTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onTaskUpdated={onTaskUpdated}
                onTaskDeleted={onTaskDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Low Priority Tasks Section - Show only when in low-priority filter mode */}
      {activeFilter === 'low-priority' && (
        <div className="mb-8 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
          <h2 className="text-xl font-semibold text-green-700 mb-4 flex items-center gap-2">
            <span>🟢</span> Low Priority Tasks ({lowPriorityTasks.length})
          </h2>
          <div className="space-y-2">
            {lowPriorityTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onTaskUpdated={onTaskUpdated}
                onTaskDeleted={onTaskDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recurring Tasks Section - Show only when in recurring filter mode */}
      {activeFilter === 'recurring' && (
        <div className="mb-8 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
          <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center gap-2">
            <span>🔄</span> Recurring Tasks ({recurringTasks.length})
          </h2>
          <div className="space-y-2">
            {recurringTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onTaskUpdated={onTaskUpdated}
                onTaskDeleted={onTaskDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Due Soon Tasks Section - Show only when in due-soon filter mode */}
      {activeFilter === 'due-soon' && (
        <div className="mb-8 p-4 rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100">
          <h2 className="text-xl font-semibold text-violet-700 mb-4 flex items-center gap-2">
            <span>⏰</span> Due Soon Tasks ({tasks.filter(t => {
              if (!t.due_date || t.completed) return false;
              const now = new Date();
              const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
              try {
                const dueDate = new Date(t.due_date);
                return dueDate >= now && dueDate <= tomorrow;
              } catch {
                return false;
              }
            }).length})
          </h2>
          <div className="space-y-2">
            {tasks.filter(t => {
              if (!t.due_date || t.completed) return false;
              const now = new Date();
              const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
              try {
                const dueDate = new Date(t.due_date);
                return dueDate >= now && dueDate <= tomorrow;
              } catch {
                return false;
              }
            }).map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onTaskUpdated={onTaskUpdated}
                onTaskDeleted={onTaskDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Show completed tasks when in 'all' filter mode */}
      {activeFilter === 'all' && completedCount > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
          <h2 className="text-xl font-semibold text-green-700 mb-4 flex items-center gap-2">
            <span>✅</span> Completed Tasks ({completedCount})
          </h2>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onTaskUpdated={onTaskUpdated}
                onTaskDeleted={onTaskDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks Section - Show only when in completed filter mode */}
      {activeFilter === 'completed' && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
          <h2 className="text-xl font-semibold text-green-700 mb-4 flex items-center gap-2">
            <span>✅</span> Completed Tasks ({completedCount})
          </h2>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onTaskUpdated={onTaskUpdated}
                onTaskDeleted={onTaskDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Show message when active filter yields no results */}
      {filteredTasks.length === 0 && activeFilter !== 'all' && (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No tasks found</h3>
          <p className="text-gray-500">There are no {activeFilter.replace('-', ' ')} tasks.</p>
          <button
            onClick={() => onFilterChange && onFilterChange('all')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            View All Tasks
          </button>
        </div>
      )}
    </div>
  );
}
