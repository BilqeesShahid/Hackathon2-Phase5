/**
 * Advanced Task Service
 *
 * API client for advanced task management features including
 * priorities, due dates, tags, recurrence, and notifications.
 */

import { createApiClient, TaskResponse, TaskCreate, TaskUpdate } from '../lib/api';

export interface AdvancedTaskResponse extends TaskResponse {
  priority?: string; // high, medium, low
  due_date?: string; // ISO date string
  tags?: string[]; // Array of tags
  recurrence?: string; // daily, weekly, monthly, custom
  recurrence_rule?: string; // iCal RRULE or custom rule
  next_occurrence?: string; // Next occurrence date
}

export interface AdvancedTaskCreate extends TaskCreate {
  priority?: string; // high, medium, low
  due_date?: string; // ISO date string
  tags?: string[]; // Array of tags
  recurrence?: string; // daily, weekly, monthly, custom
  recurrence_rule?: string; // iCal RRULE or custom rule
}

export interface AdvancedTaskUpdate extends TaskUpdate {
  priority?: string; // high, medium, low
  due_date?: string; // ISO date string
  tags?: string[]; // Array of tags
  recurrence?: string; // daily, weekly, monthly, custom
  recurrence_rule?: string; // iCal RRULE or custom rule
}

export class TaskService {
  private static readonly API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, ''); // Remove trailing slash

  /**
   * Get tasks with advanced filtering options
   */
  static async getTasks(
    userId: string,
    token: string,
    filterType: string = 'all',
    priority?: string,
    tag?: string,
    dueFrom?: string,
    dueTo?: string,
    sortBy: string = 'created_at',
    search?: string
  ): Promise<{ tasks: AdvancedTaskResponse[]; count: number }> {
    const params = new URLSearchParams({
      filter_type: filterType,
      sort_by: sortBy,
    });

    if (priority) params.append('priority', priority);
    if (tag) params.append('tag', tag);
    if (dueFrom) params.append('due_from', dueFrom);
    if (dueTo) params.append('due_to', dueTo);
    if (search) params.append('search', search);

    // The router has no prefix and is mounted with prefix="/api" in main.py
    // So actual endpoint is /api/{user_id}/tasks
    const response = await fetch(`${this.API_BASE}/api/${userId}/tasks?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const data = await response.json();
    // Handle both legacy array format and new object format
    if (Array.isArray(data)) {
      return {
        tasks: data,
        count: data.length
      };
    } else {
      return {
        tasks: data.tasks || [],
        count: data.count || 0
      };
    }
  }

  /**
   * Create a task with advanced features
   */
  static async createTask(
    userId: string,
    data: AdvancedTaskCreate,
    token: string
  ): Promise<AdvancedTaskResponse> {
    const response = await fetch(`${this.API_BASE}/api/${userId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...data
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update a task with advanced features
   */
  static async updateTask(
    userId: string,
    taskId: number,
    data: AdvancedTaskUpdate,
    token: string
  ): Promise<AdvancedTaskResponse> {
    const response = await fetch(`${this.API_BASE}/api/${userId}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to update task: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a task
   */
  static async deleteTask(
    userId: string,
    taskId: number,
    token: string
  ): Promise<void> {
    const response = await fetch(`${this.API_BASE}/api/${userId}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete task: ${response.statusText}`);
    }
  }

  /**
   * Toggle task completion status
   */
  static async toggleComplete(
    userId: string,
    taskId: number,
    token: string
  ): Promise<AdvancedTaskResponse> {
    const response = await fetch(`${this.API_BASE}/api/${userId}/tasks/${taskId}/complete`, {
      method: 'PATCH',  // Changed to PATCH as per backend API
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to toggle task completion: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get recurring tasks for a user
   */
  static async getRecurringTasks(
    userId: string,
    token: string
  ): Promise<AdvancedTaskResponse[]> {
    const response = await fetch(`${this.API_BASE}/api/${userId}/recurring-tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch recurring tasks: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get tasks by priority
   */
  static async getTasksByPriority(
    userId: string,
    priority: string,
    token: string
  ): Promise<AdvancedTaskResponse[]> {
    const params = new URLSearchParams({
      user_id: userId,
    });

    const response = await fetch(`${this.API_BASE}/api/${userId}/tasks/priority/${priority}?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks by priority: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tasks || data;
  }

  /**
   * Get tasks by tag
   */
  static async getTasksByTag(
    userId: string,
    tag: string,
    token: string
  ): Promise<AdvancedTaskResponse[]> {
    const params = new URLSearchParams({
      user_id: userId,
    });

    const response = await fetch(`${this.API_BASE}/api/${userId}/tasks/tag/${tag}?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks by tag: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tasks || data;
  }

  /**
   * Get tasks due within a date range
   */
  static async getTasksByDueDate(
    userId: string,
    dueFrom: string,
    dueTo: string,
    token: string
  ): Promise<AdvancedTaskResponse[]> {
    const params = new URLSearchParams({
      user_id: userId,
      due_from: dueFrom,
      due_to: dueTo,
    });

    const response = await fetch(`${this.API_BASE}/api/${userId}/tasks/due-range?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks by due date: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tasks || data;
  }
}