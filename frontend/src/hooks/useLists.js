import { notifications } from '@mantine/notifications'
import { useEffect, useState } from 'react'
import { listService } from '../services/lists'
import { projectService } from '../services/projects'

export const useLists = () => {
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load all user lists by getting them from all projects
  const loadLists = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get all user projects first
      const projectsResponse = await projectService.getAll()
      const projects = projectsResponse.data || []
      
      // Get detailed project data (which includes lists) for each project
      const allLists = []
      
      for (const project of projects) {
        try {
          const projectDetail = await projectService.getProjectById(project.id)
          if (projectDetail.data && projectDetail.data.lists) {
            // Add project info to each list
            projectDetail.data.lists.forEach(list => {
              allLists.push({
                ...list,
                project_name: projectDetail.data.name,
                project_id: projectDetail.data.id,
                project_status: projectDetail.data.status
              })
            })
          }
        } catch (projectError) {
          console.error(`Failed to load project ${project.id}:`, projectError)
          // Continue with other projects even if one fails
        }
      }
      
      setLists(allLists)
    } catch (err) {
      setError(err.message)
      notifications.show({
        title: 'Error',
        message: 'Failed to load lists',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  // Create a new list in a specific project
  const createList = async (listData) => {
    try {
      if (!listData.projectId) {
        throw new Error('Project is required to create a list')
      }
      
      const response = await listService.createList(listData.projectId, {
        name: listData.name,
        progress: listData.progress || 0.0
      })
      
      // Get the project info to add to the new list
      const projectsResponse = await projectService.getAll()
      const project = projectsResponse.data?.find(p => p.id === listData.projectId)
      
      const newListWithProject = {
        ...response.data,
        project_name: project?.name || 'Unknown Project',
        project_id: listData.projectId,
        project_status: project?.status || 'unknown'
      }
      
      setLists(prev => [...prev, newListWithProject])
      
      notifications.show({
        title: 'Success',
        message: 'List created successfully',
        color: 'green'
      })
      return response
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to create list',
        color: 'red'
      })
      throw err
    }
  }

  // Update a list
  const updateList = async (listId, updateData) => {
    try {
      const response = await listService.updateList(listId, updateData)
      setLists(prev => 
        prev.map(list => 
          list.id === listId ? { ...list, ...response.data } : list
        )
      )
      notifications.show({
        title: 'Success',
        message: 'List updated successfully',
        color: 'green'
      })
      return response
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to update list',
        color: 'red'
      })
      throw err
    }
  }

  // Delete a list
  const deleteList = async (listId) => {
    try {
      await listService.deleteList(listId)
      setLists(prev => prev.filter(list => list.id !== listId))
      notifications.show({
        title: 'Success',
        message: 'List deleted successfully',
        color: 'green'
      })
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to delete list',
        color: 'red'
      })
      throw err
    }
  }

  // Get a specific list with all its tasks
  const getListDetail = async (listId) => {
    try {
      const response = await listService.getListById(listId)
      return response.data
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to load list details',
        color: 'red'
      })
      throw err
    }
  }

  // Load lists on hook initialization
  useEffect(() => {
    loadLists()
  }, [])

  return {
    lists,
    loading,
    error,
    loadLists,
    createList,
    updateList,
    deleteList,
    getListDetail
  }
}