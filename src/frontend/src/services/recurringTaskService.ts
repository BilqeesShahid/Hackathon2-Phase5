/**
 * Recurring Task Service - API client for managing recurring tasks
 */

import { TaskResponse } from '../lib/api';

export class RecurringTaskService {
  private static readonly API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

  /**
   * Get recurring tasks for a user
   */
  static async getRecurringTasks(
    userId: string,
    token: string
  ): Promise<TaskResponse[]> {
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
   * Get next occurrences for a recurring task
   */
  static async getNextOccurrences(
    recurringTaskId: number,
    count: number = 5,
    token: string
  ): Promise<{ occurrences: string[] }> {
    // Placeholder implementation - this endpoint doesn't exist in the backend yet
    return {
      occurrences: []
    };
  }
}