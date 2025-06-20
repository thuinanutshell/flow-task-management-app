import { notifications } from '@mantine/notifications'
import { useEffect, useState } from 'react'
import { projectService } from '../services/projects'

export const useProjects = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load all user projects
  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await projectService.getAll()
      setProjects(response.data || [])
    } catch (err) {
      setError(err.message)
      notifications.show({
        title: 'Error',
        message: 'Failed to load projects',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  // Create a new project
  const createProject = async (projectData) => {
    try {
      const response = await projectService.createProject(projectData)
      setProjects(prev => [...prev, response.data])
      notifications.show({
        title: 'Success',
        message: 'Project created successfully',
        color: 'green'
      })
      return response
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to create project',
        color: 'red'
      })
      throw err
    }
  }

  // Update a project
  const updateProject = async (projectId, updateData) => {
    try {
      const response = await projectService.updateProject(projectId, updateData)
      setProjects(prev => 
        prev.map(project => 
          project.id === projectId ? response.data : project
        )
      )
      notifications.show({
        title: 'Success',
        message: 'Project updated successfully',
        color: 'green'
      })
      return response
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to update project',
        color: 'red'
      })
      throw err
    }
  }

  // Delete a project
  const deleteProject = async (projectId) => {
    try {
      await projectService.deleteProject(projectId)
      setProjects(prev => prev.filter(project => project.id !== projectId))
      notifications.show({
        title: 'Success',
        message: 'Project deleted successfully',
        color: 'green'
      })
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to delete project',
        color: 'red'
      })
      throw err
    }
  }

  // Get a specific project with all its lists
  const getProjectDetail = async (projectId) => {
    try {
      const response = await projectService.getProjectById(projectId)
      return response.data
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to load project details',
        color: 'red'
      })
      throw err
    }
  }

  // Get project summary
  const getProjectSummary = async (projectId) => {
    try {
      const response = await projectService.getProjectSummary(projectId)
      return response.data
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to load project summary',
        color: 'red'
      })
      throw err
    }
  }

  // Load projects on hook initialization
  useEffect(() => {
    loadProjects()
  }, [])

  return {
    projects,
    loading,
    error,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    getProjectDetail,
    getProjectSummary
  }
}