// services/tasks.js
import api, { apiCall } from './api'

class TaskService {
  // Create a new task
  async createTask(taskData) {
    return apiCall(() => 
      api.post('/task/', {
        name: taskData.name,
        description: taskData.description || '',
        list_id: taskData.listId,
        priority: taskData.priority,
        planned_duration: taskData.plannedDuration,
        category_id: taskData.categoryId || null
      })
    )
  }

  // Get a specific task by ID
  async getTaskById(taskId) {
    return apiCall(() => api.get(`/task/${taskId}`))
  }

  // Update a task
  async updateTask(taskId, updateData) {
    return apiCall(() => 
      api.patch(`/tasks/${taskId}`, {
        name: updateData.name,
        description: updateData.description,
        priority: updateData.priority,
        planned_duration: updateData.plannedDuration,
        category_id: updateData.categoryId
      })
    )
  }

  // Delete a task
  async deleteTask(taskId) {
    return apiCall(() => api.delete(`/task/${taskId}`))
  }

  // Get task creation options (categories, priorities, etc.)
  async getTaskCreateOptions() {
    return apiCall(() => api.get('/task/create-options'))
  }

  // ===============================
  // TIMER ENDPOINTS
  // ===============================

  // Start work session (handles start/resume/extend)
  async startWorkSession(taskId, durationMinutes) {
    return apiCall(() => 
      api.post(`/tasks/${taskId}/timer/work`, {
        duration_minutes: durationMinutes
      })
    )
  }

  // Pause active timer
  async pauseTimer(taskId) {
    return apiCall(() => api.post(`/tasks/${taskId}/timer/pause`))
  }

  // Complete task (requires mental_state and reflection)
  async completeTask(taskId, mentalState, reflection) {
    return apiCall(() => 
      api.post(`/tasks/${taskId}/timer/complete`, {
        mental_state: mentalState,
        reflection: reflection
      })
    )
  }

  // Get timer status for a task
  async getTimerStatus(taskId) {
    return apiCall(() => api.get(`/task/${taskId}/timer/status`))
  }

  // Poll timer status (lightweight for frequent updates)
  async pollTimerStatus(taskId) {
    return apiCall(() => api.get(`/task/${taskId}/timer/poll`))
  }
}

// Export singleton instance
export const taskService = new TaskService()
export default taskService