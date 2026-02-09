/**
 * Dashboard Stats Component
 *
 * Shows key metrics and statistics for the task management dashboard
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TaskService } from '../services/taskService';
import { RecurringTaskService } from '../services/recurringTaskService';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  onClick?: () => void;
}

interface DashboardStatsProps {
  userId: string;
  token: string;
  onFilterChange?: (filter: 'all' | 'pending' | 'completed' | 'high-priority' | 'medium-priority' | 'low-priority' | 'recurring' | 'due-soon') => void;
}

interface DashboardData {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
  upcomingDueTasks: number; // Due within 24 hours
  recurringTasks: number;
}

type TaskResponseType = Awaited<ReturnType<typeof TaskService.getTasks>>;
type RecurringTasksResponseType = Awaited<
  ReturnType<typeof RecurringTaskService.getRecurringTasks>
>;

export default function DashboardStats({ userId, token, onFilterChange }: DashboardStatsProps) {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all tasks
      const taskResponse: TaskResponseType = await TaskService.getTasks(
        userId,
        token,
        'all',
        undefined,
        undefined,
        undefined,
        undefined,
        'created_at',
        undefined
      );

      // Get recurring tasks (safe fallback)
      let recurringTasks: RecurringTasksResponseType = [];
      try {
        recurringTasks = await RecurringTaskService.getRecurringTasks(userId, token);
      } catch (err) {
        console.warn('RecurringTaskService not implemented, using empty array:', err);
        recurringTasks = [];
      }

      // Calculate stats
      const allTasks = taskResponse.tasks || [];
      const pendingTasks = allTasks.filter(task => task && !task.completed).length;
      const completedTasks = allTasks.filter(task => task && task.completed).length;

      const now = new Date();
      const overdueTasks = allTasks.filter(task => {
        if (!task || task.completed || !task.due_date) return false;
        try {
          const dueDate = new Date(task.due_date);
          return dueDate < now;
        } catch {
          return false; // Invalid date
        }
      }).length;

      const highPriorityTasks = allTasks.filter(task => 
        task && task.priority === 'high' && !task.completed
      ).length;

      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const upcomingDueTasks = allTasks.filter(task => {
        if (!task || task.completed || !task.due_date) return false;
        try {
          const dueDate = new Date(task.due_date);
          return dueDate >= now && dueDate <= oneDayFromNow;
        } catch {
          return false; // Invalid date
        }
      }).length;

      const statsData: DashboardData = {
        totalTasks: allTasks.length,
        pendingTasks,
        completedTasks,
        overdueTasks,
        highPriorityTasks,
        upcomingDueTasks,
        recurringTasks: Array.isArray(recurringTasks) ? recurringTasks.length : 0,
      };

      setStats(statsData);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    if (userId && token) {
      // Add a small delay to prevent potential race conditions
      const timer = setTimeout(() => {
        fetchStats();
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="bg-white/20 p-4 rounded-lg shadow-sm border border-white/30 animate-pulse"
          >
            <div className="h-4 bg-white/30 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-white/30 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50/20 border border-red-200/50 text-red-200 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-300">
        No statistics available
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: '📋',
      color: 'bg-blue-500/20 text-blue-200',
    },
    {
      title: 'Pending',
      value: stats.pendingTasks,
      icon: '⏳',
      color: 'bg-yellow-500/20 text-yellow-200',
    },
    {
      title: 'Completed',
      value: stats.completedTasks,
      icon: '✅',
      color: 'bg-green-500/20 text-green-200',
    },
    {
      title: 'Overdue',
      value: stats.overdueTasks,
      icon: '⏰',
      color: 'bg-red-500/20 text-red-200',
    },
    {
      title: 'High Priority',
      value: stats.highPriorityTasks,
      icon: '🔴',
      color: 'bg-orange-500/20 text-orange-200',
    },
    {
      title: 'Recurring',
      value: stats.recurringTasks,
      icon: '🔄',
      color: 'bg-blue-500/20 text-blue-200',
    },
    {
      title: 'Due Soon',
      value: stats.upcomingDueTasks,
      icon: '📅',
      color: 'bg-purple-500/20 text-purple-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className={`bg-white/20 p-4 rounded-lg shadow-sm border border-white/30 hover:shadow-md transition-shadow backdrop-blur-sm ${
            onFilterChange && stat.title === 'Recurring' ? 'cursor-pointer hover:bg-white/30' : ''
          }`}
          onClick={onFilterChange && stat.title === 'Recurring' ? () => onFilterChange('recurring') : undefined}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">{stat.title}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
            <div
              className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center text-xl`}
            >
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
