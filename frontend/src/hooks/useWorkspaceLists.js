// hooks/useWorkspaceLists.js
import { notifications } from '@mantine/notifications'
import { useEffect, useState } from 'react'
import { listService } from '../services/lists'

// Get today's date as a string (YYYY-MM-DD)
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0]
}

// Get localStorage key for today's workspace
const getTodayWorkspaceKey = () => {
  return `flow_workspace_lists_${getTodayDateString()}`
}

export const useWorkspaceLists = () => {
  // Lists that user has added to their workspace (dashboard) for TODAY
  const [workspaceLists, setWorkspaceLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentDate, setCurrentDate] = useState(getTodayDateString())

  // Load workspace lists from localStorage for today's date
  useEffect(() => {
    const loadTodayWorkspaceLists = () => {
      try {
        setLoading(true)
        const todayKey = getTodayWorkspaceKey()
        const savedLists = localStorage.getItem(todayKey)
        
        console.log(`Loading workspace lists for ${getTodayDateString()}:`, savedLists) // Debug log
        
        if (savedLists) {
          const parsedLists = JSON.parse(savedLists)
          console.log('Parsed today\'s workspace lists:', parsedLists) // Debug log
          setWorkspaceLists(parsedLists)
        } else {
          console.log(`No workspace lists found for ${getTodayDateString()}`) // Debug log
          setWorkspaceLists([])
        }
        
        setCurrentDate(getTodayDateString())
      } catch (error) {
        console.error('Failed to load today\'s workspace lists from localStorage:', error)
        setWorkspaceLists([])
        setError('Failed to load workspace lists')
      } finally {
        setLoading(false)
      }
    }

    loadTodayWorkspaceLists()
  }, [])

  // Save workspace lists to localStorage for today's date whenever they change
  useEffect(() => {
    // Skip saving on initial load
    if (loading) return
    
    try {
      const todayKey = getTodayWorkspaceKey()
      console.log(`Saving workspace lists for ${getTodayDateString()}:`, workspaceLists) // Debug log
      localStorage.setItem(todayKey, JSON.stringify(workspaceLists))
    } catch (error) {
      console.error('Failed to save today\'s workspace lists to localStorage:', error)
    }
  }, [workspaceLists, loading])

  // Create a new list and automatically add it to today's workspace
  const createListInWorkspace = async (listData) => {
    try {
      if (!listData.projectId) {
        throw new Error('Project is required to create a list')
      }
      
      const response = await listService.createList(listData.projectId, {
        name: listData.name,
        progress: listData.progress || 0.0
      })
      
      // Get the project info to add to the new list
      const { projectService } = await import('../services/projects')
      const projectsResponse = await projectService.getAll()
      const project = projectsResponse.data?.find(p => p.id === listData.projectId)
      
      const newListWithProject = {
        ...response.data,
        project_name: project?.name || 'Unknown Project',
        project_id: listData.projectId,
        project_status: project?.status || 'unknown',
        isWorkspaceList: false, // This is a dashboard-created list, not imported
        addedToWorkspaceAt: new Date().toISOString(),
        workspaceDate: getTodayDateString(), // Track which date this was added
        // Add task counts
        total_tasks: 0,
        completed_tasks: 0,
        task_count: 0
      }
      
      // Add to today's workspace lists
      setWorkspaceLists(prev => {
        const updatedLists = [...prev, newListWithProject]
        console.log('Adding new list to today\'s workspace:', newListWithProject) // Debug log
        return updatedLists
      })
      
      notifications.show({
        title: 'Success',
        message: 'List created and added to today\'s workspace',
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

  // Import existing lists from projects to today's workspace
  const importListsToWorkspace = async (selectedLists) => {
    try {
      const newWorkspaceLists = selectedLists.map(list => ({
        ...list,
        isWorkspaceList: true, // Flag to identify imported lists
        originalProjectId: list.project_id,
        originalProjectName: list.project_name || 'Unknown Project',
        addedToWorkspaceAt: new Date().toISOString(),
        workspaceDate: getTodayDateString(), // Track which date this was added
        // Ensure we have task counts
        total_tasks: list.task_count || 0,
        completed_tasks: list.completed_tasks || 0,
        task_count: list.task_count || 0
      }))
      
      setWorkspaceLists(prev => {
        // Avoid duplicates by checking if list ID already exists in today's workspace
        const existingIds = prev.map(l => l.id)
        const uniqueNewLists = newWorkspaceLists.filter(l => !existingIds.includes(l.id))
        const updatedLists = [...prev, ...uniqueNewLists]
        console.log('Importing lists to today\'s workspace:', uniqueNewLists) // Debug log
        return updatedLists
      })
      
      notifications.show({
        title: 'Success',
        message: `Added ${selectedLists.length} list(s) to today's workspace`,
        color: 'green'
      })
    } catch (error) {
      console.error('Failed to import lists:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to import lists to workspace',
        color: 'red'
      })
    }
  }

  // Remove a list from today's workspace (doesn't delete the actual list)
  const removeFromWorkspace = async (listId) => {
    try {
      setWorkspaceLists(prev => {
        const updatedLists = prev.filter(list => list.id !== listId)
        console.log('Removing list from today\'s workspace:', listId) // Debug log
        return updatedLists
      })
      notifications.show({
        title: 'Success',
        message: 'List removed from today\'s workspace',
        color: 'green'
      })
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to remove list from workspace',
        color: 'red'
      })
    }
  }

  // Delete a list completely (only for dashboard-created lists)
  const deleteListCompletely = async (listId) => {
    try {
      await listService.deleteList(listId)
      setWorkspaceLists(prev => {
        const updatedLists = prev.filter(list => list.id !== listId)
        console.log('Deleting list completely:', listId) // Debug log
        return updatedLists
      })
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

  // Get historical workspace data (for analytics)
  const getHistoricalWorkspaces = () => {
    const historicalData = []
    const keys = Object.keys(localStorage)
    
    keys.forEach(key => {
      if (key.startsWith('flow_workspace_lists_')) {
        try {
          const date = key.replace('flow_workspace_lists_', '')
          const data = JSON.parse(localStorage.getItem(key))
          historicalData.push({
            date,
            lists: data,
            totalLists: data.length,
            totalTasks: data.reduce((sum, list) => sum + (list.total_tasks || 0), 0),
            completedTasks: data.reduce((sum, list) => sum + (list.completed_tasks || 0), 0)
          })
        } catch (error) {
          console.error(`Failed to parse historical data for ${key}:`, error)
        }
      }
    })
    
    // Sort by date (newest first)
    return historicalData.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  // Clear today's workspace (for debugging)
  const clearTodayWorkspace = () => {
    setWorkspaceLists([])
    const todayKey = getTodayWorkspaceKey()
    localStorage.removeItem(todayKey)
    console.log(`Today's workspace cleared (${getTodayDateString()})`) // Debug log
  }

  // Clear old workspaces (keep only last N days)
  const cleanupOldWorkspaces = (daysToKeep = 30) => {
    const keys = Object.keys(localStorage)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    keys.forEach(key => {
      if (key.startsWith('flow_workspace_lists_')) {
        try {
          const dateStr = key.replace('flow_workspace_lists_', '')
          const date = new Date(dateStr)
          
          if (date < cutoffDate) {
            localStorage.removeItem(key)
            console.log(`Removed old workspace data for ${dateStr}`)
          }
        } catch (error) {
          console.error(`Failed to process cleanup for ${key}:`, error)
        }
      }
    })
  }

  return {
    workspaceLists,
    loading,
    error,
    currentDate,
    createListInWorkspace,
    importListsToWorkspace,
    removeFromWorkspace,
    deleteListCompletely,
    getListDetail,
    getHistoricalWorkspaces,
    clearTodayWorkspace, // For debugging
    cleanupOldWorkspaces
  }
}