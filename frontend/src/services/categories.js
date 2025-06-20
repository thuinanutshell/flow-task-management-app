// services/categories.js
import api, { apiCall } from './api'

class CategoryService {
  // Create a new category
  async createCategory(categoryData) {
    return apiCall(() => 
      api.post('/categories/', {
        name: categoryData.name,
        color: categoryData.color
      })
    )
  }

  // Get all categories for the current user
  async getAll() {
    return apiCall(() => api.get('/categories/'))
  }

  // Get a specific category by ID
  async getCategoryById(categoryId) {
    return apiCall(() => api.get(`/categories/${categoryId}`))
  }

  // Update a category
  async updateCategory(categoryId, updateData) {
    return apiCall(() => 
      api.patch(`/categories/${categoryId}`, {
        name: updateData.name,
        color: updateData.color
      })
    )
  }

  // Delete a category
  async deleteCategory(categoryId) {
    return apiCall(() => api.delete(`/categories/${categoryId}`))
  }

  // Get all tasks for a specific category
  async getCategoryTasks(categoryId) {
    return apiCall(() => api.get(`/categories/${categoryId}/tasks`))
  }

  // Get category options for dropdowns
  async getCategoryOptions() {
    return apiCall(() => api.get('/categories/options'))
  }
}

// Export singleton instance
export const categoryService = new CategoryService()
export default categoryService