/*API client utility with authentication for Phase V Advanced Task Management.*/
import axios, { AxiosInstance, AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Create an authenticated API client.
 * The auth token should be set separately via setAuthToken.
 */
export function createApiClient(token?: string): AxiosInstance {
  return axios.create({
    baseURL: API_URL,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

/**
 * API error response structure
 */
export interface ApiError {
  detail: string;
}

/**
 * Task response from API with advanced features
 */
export interface TaskResponse {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  priority?: string; // high, medium, low
  due_date?: string; // ISO date string
  tags?: string[]; // Array of tags
  recurrence?: string; // daily, weekly, monthly, custom
  recurrence_rule?: string; // iCal RRULE or custom rule
  next_occurrence?: string; // Next occurrence date
}

/**
 * Create task request with advanced features
 */
export interface TaskCreate {
  title: string;
  description?: string;
  priority?: string; // high, medium, low
  due_date?: string; // ISO date string
  tags?: string[]; // Array of tags
  recurrence?: string; // daily, weekly, monthly, custom
  recurrence_rule?: string; // iCal RRULE or custom rule
}

/**
 * Update task request with advanced features
 */
export interface TaskUpdate {
  title?: string;
  description?: string;
  priority?: string; // high, medium, low
  due_date?: string; // ISO date string
  tags?: string[]; // Array of tags
  recurrence?: string; // daily, weekly, monthly, custom
  recurrence_rule?: string; // iCal RRULE or custom rule
}

/**
 * Get tasks for a user with filtering options
 */
export async function getTasks(
  userId: string,
  token: string,
  filterType: string = 'all',
  priority?: string,
  tag?: string,
  dueFrom?: string,
  dueTo?: string,
  sortBy: string = 'created_at',
  search?: string
): Promise<{ tasks: TaskResponse[]; count: number }> {
  const api = createApiClient(token);

  // Build query parameters
  const params = new URLSearchParams({
    filter_type: filterType,
    sort_by: sortBy,
  });

  if (priority) params.append('priority', priority);
  if (tag) params.append('tag', tag);
  if (dueFrom) params.append('due_from', dueFrom);
  if (dueTo) params.append('due_to', dueTo);
  if (search) params.append('search', search);

  const response = await api.get<{ tasks: TaskResponse[]; count: number }>(`/api/${userId}/tasks?${params}`);
  return response.data;
}

/**
 * Create a new task with advanced features
 */
export async function createTask(
  userId: string,
  data: TaskCreate,
  token: string
): Promise<TaskResponse> {
  const api = createApiClient(token);
  const response = await api.post<TaskResponse>(`/api/${userId}/tasks`, data);
  return response.data;
}

/**
 * Update a task with advanced features
 */
export async function updateTask(
  userId: string,
  taskId: number,
  data: TaskUpdate,
  token: string
): Promise<TaskResponse> {
  const api = createApiClient(token);
  const response = await api.put<TaskResponse>(
    `/api/${userId}/tasks/${taskId}`,
    data
  );
  return response.data;
}

/**
 * Delete a task
 */
export async function deleteTask(
  userId: string,
  taskId: number,
  token: string
): Promise<void> {
  const api = createApiClient(token);
  await api.delete(`/api/${userId}/tasks/${taskId}`);
}

/**
 * Toggle task completion status
 */
export async function toggleComplete(
  userId: string,
  taskId: number,
  token: string
): Promise<TaskResponse> {
  const api = createApiClient(token);
  const response = await api.patch<TaskResponse>(
    `/api/${userId}/tasks/${taskId}/complete`
  );
  return response.data;
}
