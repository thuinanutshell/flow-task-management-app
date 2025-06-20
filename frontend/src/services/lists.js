// services/lists.js
import api, { apiCall } from './api'

class ListService {
  // Create a new list in a specific project
  async createList(projectId, listData) {
    return apiCall(() => 
      api.post(`/list/${projectId}`, {
        name: listData.name,
        progress: listData.progress || 0.0
      })
    )
  }

  // Get a specific list with all its tasks
  async getListById(listId) {
    return apiCall(() => api.get(`/list/${listId}`))
  }

  // Update a list
  async updateList(listId, updateData) {
    return apiCall(() => 
      api.patch(`/list/${listId}`, {
        name: updateData.name,
        progress: updateData.progress
      })
    )
  }

  // Delete a list and all its tasks
  async deleteList(listId) {
    return apiCall(() => api.delete(`/list/${listId}`))
  }

  // Get list summary (without full task details)
  async getListSummary(listId) {
    return apiCall(() => api.get(`/list/${listId}/summary`))
  }
}

// Export singleton instance
export const listService = new ListService()
export default listService