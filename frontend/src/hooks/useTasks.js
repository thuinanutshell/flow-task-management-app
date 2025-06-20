// hooks/useTasks.js
import { notifications } from '@mantine/notifications'
import { useEffect, useState } from 'react'
import { taskService } from '../services/tasks'

export const useTasks = (listId = null) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [taskOptions, setTaskOptions] = useState(null)

  // Load task creation options (categories, priorities)
  const loadTaskOptions = async () => {
    try {
      const response = await taskService.getTaskCreateOptions()
      setTaskOptions(response.data)
    } catch (err) {
      console.error('Failed to load task options:', err)
    }
  }

  // Create a new task
  const createTask = async (taskData) => {
    try {
      const response = await taskService.createTask(taskData)
      
      // Add to local state if this task belongs to our current list
      if (!listId || taskData.listId === listId) {
        setTasks(prev => [...prev, response.data])
      }
      
      notifications.show({
        title: 'Success',
        message: 'Task created successfully',
        color: 'green'
      })
      return response
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to create task',
        color: 'red'
      })
      throw err
    }
  }

  // Update a task
  const updateTask = async (taskId, updateData) => {
    try {
      const response = await taskService.updateTask(taskId, updateData)
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? response.data : task
        )
      )
      notifications.show({
        title: 'Success',
        message: 'Task updated successfully',
        color: 'green'
      })
      return response
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to update task',
        color: 'red'
      })
      throw err
    }
  }

  // Delete a task
  const deleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId)
      setTasks(prev => prev.filter(task => task.id !== taskId))
      notifications.show({
        title: 'Success',
        message: 'Task deleted successfully',
        color: 'green'
      })
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to delete task',
        color: 'red'
      })
      throw err
    }
  }

  // Get a specific task with details
  const getTaskDetail = async (taskId) => {
    try {
      const response = await taskService.getTaskById(taskId)
      return response.data
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to load task details',
        color: 'red'
      })
      throw err
    }
  }

  // Load task options on hook initialization
  useEffect(() => {
    loadTaskOptions()
  }, [])

  return {
    tasks,
    loading,
    error,
    taskOptions,
    createTask,
    updateTask,
    deleteTask,
    getTaskDetail,
    loadTaskOptions
  }
}