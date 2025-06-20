// services/projects.js
import api, { apiCall } from './api'

class ProjectService {
  // Create a new project
  async createProject(projectData) {
    return apiCall(() => 
      api.post('/project/', {
        name: projectData.name,
        description: projectData.description || '',
        status: projectData.status || 'not_started'
      })
    )
  }

  // Get all projects for the current user
  async getAll() {
    return apiCall(() => api.get('/project/'))
  }

  // Get a specific project with all its lists
  async getProjectById(projectId) {
    return apiCall(() => api.get(`/project/${projectId}`))
  }

  // Update a project
  async updateProject(projectId, updateData) {
    return apiCall(() => 
      api.patch(`/project/${projectId}`, {
        name: updateData.name,
        description: updateData.description,
        status: updateData.status
      })
    )
  }

  // Delete a project and all its lists/tasks
  async deleteProject(projectId) {
    return apiCall(() => api.delete(`/project/${projectId}`))
  }

  // Get project summary (without detailed list info)
  async getProjectSummary(projectId) {
    return apiCall(() => api.get(`/project/${projectId}/summary`))
  }

  // Get all lists for a specific project
  async getProjectLists(projectId) {
    return apiCall(() => api.get(`/project/${projectId}/lists`))
  }
}

export const projectService = new ProjectService()
export default projectService