"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { TaskList } from "../components/TaskList";
import { Sidebar } from "../components/Sidebar";
import { MobileSidebar } from "../components/MobileSidebar";
import { TaskResponse } from "@/lib/api";
import { TaskService } from "../services/taskService";

const DashboardStats = React.lazy(() => import("../components/DashboardStats"));
import ErrorBoundary from "../components/ErrorBoundary";

export default function DashboardPage() {
  const { user, session, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed' | 'high-priority' | 'medium-priority' | 'low-priority' | 'recurring' | 'due-soon'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🔐 FIX: backend user id is probably user.user_id or user.sub
  const userId = (user as any)?.id || (user as any)?.user_id || (user as any)?.sub;

  const username = user?.email ? user.email.split("@")[0] : "";

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && (!session || !user)) {
      router.push("/sign-in");
    }
  }, [session, user, isLoading, router]);

  // Fetch tasks
  useEffect(() => {
    if (!session || !userId) {
      setTasksLoading(false);
      return;
    }

    async function fetchTasks() {
      try {
        const token =
          (session as any)?.access_token ||
          (session as any)?.token ||
          "";

        if (!token) {
          setError("Authentication token missing");
          setTasksLoading(false);
          return;
        }

        const response = await TaskService.getTasks(
          userId,
          token,
          "all",
          undefined,
          undefined,
          undefined,
          undefined,
          "created_at",
          undefined
        );

        setTasks(response.tasks || []);
      } catch (err: any) {
        console.error("Error fetching tasks:", err);

        if (
          err.message?.includes("401") ||
          err.message?.includes("403") ||
          err.message?.toLowerCase().includes("unauthorized")
        ) {
          try {
            await signOut();
          } finally {
            router.push("/sign-in");
          }
          return;
        }

        setError(err.message || "Failed to load tasks");
      } finally {
        setTasksLoading(false);
      }
    }

    fetchTasks();
  }, [session, userId, router, signOut]);

  async function handleTaskUpdated() {
    if (!session || !userId) return;

    try {
      const token =
        (session as any)?.access_token ||
        (session as any)?.token ||
        "";

      const response = await TaskService.getTasks(
        userId,
        token,
        "all",
        undefined,
        undefined,
        undefined,
        undefined,
        "created_at",
        undefined
      );

      setTasks(response.tasks || []);
    } catch (err: any) {
      console.error("Failed to refresh tasks:", err);
    }
  }

  async function handleTaskDeleted() {
    await handleTaskUpdated();
  }

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!session || !user || !userId) {
    return null;
  }

  return (
    <div className="min-h-screen relative flex overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Background */}
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/task12.webp')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/75 via-purple-600/75 to-pink-600/75" />
        </div>

        {/* Header */}
        <header className="bg-gradient-to-r from-purple-300/95 via-pink-300/95 to-purple-300/95 backdrop-blur-sm shadow-lg border-b border-purple-400/70 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-900 to-pink-900 bg-clip-text text-transparent">
                TaskMaster Pro
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-purple-950">
                  Welcome, {username}
                </p>
                <p className="text-xs text-purple-800 truncate max-w-[150px]">
                  {user.email}
                </p>
              </div>

              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2 rounded-lg hover:bg-purple-200 transition-colors"
                  aria-label="Open menu"
                >
                  <svg
                    className="w-6 h-6 text-purple-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>

              <button
                onClick={() => router.push("/chat")}
                className="hidden md:flex px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg items-center gap-2 font-medium"
              >
                AI Chat
              </button>

              <button
                onClick={handleSignOut}
                className="hidden md:flex px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Welcome */}
        <div className="bg-white/10 backdrop-blur-md text-white shadow-xl border-b border-white/20 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">
              Welcome to Your Advanced Task Dashboard
            </h2>
            <p className="text-white/90 text-lg drop-shadow">
              Manage tasks with priorities, due dates, tags, and recurring patterns
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white/10 backdrop-blur-md shadow-xl border-b border-white/20 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {userId && session && (
              <Suspense
                fallback={
                  <div className="h-32 bg-white/20 rounded-lg animate-pulse"></div>
                }
              >
                <ErrorBoundary
                  fallback={
                    <div className="text-red-500 text-center py-4">
                      Failed to load dashboard stats
                    </div>
                  }
                >
                  <DashboardStats
                    userId={userId}
                    token={
                      (session as any)?.access_token ||
                      (session as any)?.token ||
                      ""
                    }
                    onFilterChange={setActiveFilter}
                  />
                </ErrorBoundary>
              </Suspense>
            )}
          </div>
        </div>

        {/* Main */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow relative z-10 overflow-x-hidden">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {tasksLoading ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-gray-500">Loading tasks...</div>
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-purple-300/95 via-pink-300/95 to-purple-300/95 backdrop-blur-sm border-t border-purple-400/70 mt-auto shadow-lg relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <p className="text-purple-950 font-semibold">
                  Made with ❤️ by Bilqees Shahid
                </p>
                <p className="text-sm text-purple-800 mt-1">
                  © {new Date().getFullYear()} All rights reserved
                </p>
              </div>
              <div className="flex items-center gap-2 text-purple-900">
                <span className="text-sm font-medium">TaskMaster Pro</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
