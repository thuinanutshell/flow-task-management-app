// hooks/useCategories.js
import { notifications } from '@mantine/notifications'
import { useEffect, useState } from 'react'
import { categoryService } from '../services/categories'

export const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load all user categories
  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await categoryService.getAll()
      setCategories(response.data || [])
    } catch (err) {
      setError(err.message)
      notifications.show({
        title: 'Error',
        message: 'Failed to load categories',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  // Create a new category
  const createCategory = async (categoryData) => {
    try {
      const response = await categoryService.createCategory(categoryData)
      setCategories(prev => [...prev, response.data])
      notifications.show({
        title: 'Success',
        message: 'Category created successfully',
        color: 'green'
      })
      return response
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to create category',
        color: 'red'
      })
      throw err
    }
  }

  // Update a category
  const updateCategory = async (categoryId, updateData) => {
    try {
      const response = await categoryService.updateCategory(categoryId, updateData)
      setCategories(prev => 
        prev.map(category => 
          category.id === categoryId ? response.data : category
        )
      )
      notifications.show({
        title: 'Success',
        message: 'Category updated successfully',
        color: 'green'
      })
      return response
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to update category',
        color: 'red'
      })
      throw err
    }
  }

  // Delete a category
  const deleteCategory = async (categoryId) => {
    try {
      await categoryService.deleteCategory(categoryId)
      setCategories(prev => prev.filter(category => category.id !== categoryId))
      notifications.show({
        title: 'Success',
        message: 'Category deleted successfully',
        color: 'green'
      })
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to delete category',
        color: 'red'
      })
      throw err
    }
  }

  // Get category details with tasks
  const getCategoryDetail = async (categoryId) => {
    try {
      const response = await categoryService.getCategoryTasks(categoryId)
      return response.data
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to load category details',
        color: 'red'
      })
      throw err
    }
  }

  // Get category options for dropdowns
  const getCategoryOptions = async () => {
    try {
      const response = await categoryService.getCategoryOptions()
      return response.data
    } catch (err) {
      console.error('Failed to load category options:', err)
      return []
    }
  }

  // Load categories on hook initialization
  useEffect(() => {
    loadCategories()
  }, [])

  return {
    categories,
    loading,
    error,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryDetail,
    getCategoryOptions
  }
}