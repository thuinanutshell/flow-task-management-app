import { notifications } from '@mantine/notifications'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listService } from '../services/lists'

// Get today's date as a string (YYYY-MM-DD)
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0]
}

// Get localStorage key for today's workspace with user ID
const getTodayWorkspaceKey = (userId) => {
  if (!userId) return null
  return `flow_workspace_lists_${userId}_${getTodayDateString()}`
}

export const useWorkspaceLists = () => {
  const { user } = useAuth() // Get current user from auth context
  const [workspaceLists, setWorkspaceLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentDate, setCurrentDate] = useState(getTodayDateString())

  // Load workspace lists from localStorage for today's date and current user
  useEffect(() => {
    const loadTodayWorkspaceLists = () => {
      try {
        setLoading(true)
        
        if (!user?.id) {
          console.log('No user logged in, clearing workspace')
          setWorkspaceLists([])
          return
        }
        
        const todayKey = getTodayWorkspaceKey(user.id)
        if (!todayKey) {
          setWorkspaceLists([])
          return
        }
        
        const savedLists = localStorage.getItem(todayKey)
        
        console.log(`Loading workspace lists for user ${user.id} on ${getTodayDateString()}:`, savedLists)
        
        if (savedLists) {
          const parsedLists = JSON.parse(savedLists)
          console.log('Parsed today\'s workspace lists:', parsedLists)
          setWorkspaceLists(parsedLists)
        } else {
          console.log(`No workspace lists found for user ${user.id} on ${getTodayDateString()}`)
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
  }, [user?.id]) // Re-run when user changes

  // Save workspace lists to localStorage for today's date whenever they change
  useEffect(() => {
    // Skip saving on initial load or if no user
    if (loading || !user?.id) return
    
    try {
      const todayKey = getTodayWorkspaceKey(user.id)
      if (!todayKey) return
      
      console.log(`Saving workspace lists for user ${user.id} on ${getTodayDateString()}:`, workspaceLists)
      localStorage.setItem(todayKey, JSON.stringify(workspaceLists))
    } catch (error) {
      console.error('Failed to save today\'s workspace lists to localStorage:', error)
    }
  }, [workspaceLists, loading, user?.id])

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
        isWorkspaceList: false,
        addedToWorkspaceAt: new Date().toISOString(),
        workspaceDate: getTodayDateString(),
        userId: user?.id, // Add user ID for tracking
        total_tasks: 0,
        completed_tasks: 0,
        task_count: 0
      }
      
      setWorkspaceLists(prev => {
        const updatedLists = [...prev, newListWithProject]
        console.log('Adding new list to today\'s workspace:', newListWithProject)
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
        isWorkspaceList: true,
        originalProjectId: list.project_id,
        originalProjectName: list.project_name || 'Unknown Project',
        addedToWorkspaceAt: new Date().toISOString(),
        workspaceDate: getTodayDateString(),
        userId: user?.id, // Add user ID for tracking
        total_tasks: list.task_count || 0,
        completed_tasks: list.completed_tasks || 0,
        task_count: list.task_count || 0
      }))
      
      setWorkspaceLists(prev => {
        const existingIds = prev.map(l => l.id)
        const uniqueNewLists = newWorkspaceLists.filter(l => !existingIds.includes(l.id))
        const updatedLists = [...prev, ...uniqueNewLists]
        console.log('Importing lists to today\'s workspace:', uniqueNewLists)
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
        console.log('Removing list from today\'s workspace:', listId)
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
        console.log('Deleting list completely:', listId)
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

  // Get historical workspace data for current user (for analytics)
  const getHistoricalWorkspaces = () => {
    if (!user?.id) return []
    
    const historicalData = []
    const keys = Object.keys(localStorage)
    
    keys.forEach(key => {
      if (key.startsWith(`flow_workspace_lists_${user.id}_`)) {
        try {
          const date = key.replace(`flow_workspace_lists_${user.id}_`, '')
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
    
    return historicalData.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  // Clear today's workspace for current user
  const clearTodayWorkspace = () => {
    if (!user?.id) return
    
    setWorkspaceLists([])
    const todayKey = getTodayWorkspaceKey(user.id)
    if (todayKey) {
      localStorage.removeItem(todayKey)
      console.log(`Today's workspace cleared for user ${user.id} (${getTodayDateString()})`)
    }
  }

  // Clean up old workspaces for current user (keep only last N days)
  const cleanupOldWorkspaces = (daysToKeep = 30) => {
    if (!user?.id) return
    
    const keys = Object.keys(localStorage)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    keys.forEach(key => {
      if (key.startsWith(`flow_workspace_lists_${user.id}_`)) {
        try {
          const dateStr = key.replace(`flow_workspace_lists_${user.id}_`, '')
          const date = new Date(dateStr)
          
          if (date < cutoffDate) {
            localStorage.removeItem(key)
            console.log(`Removed old workspace data for user ${user.id} on ${dateStr}`)
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
    clearTodayWorkspace,
    cleanupOldWorkspaces
  }
}