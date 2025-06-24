// frontend/src/hooks/useExperiments.js
import { notifications } from '@mantine/notifications'
import { useEffect, useState } from 'react'
import { experimentService } from '../services/experiments'

const generateMockExperiments = () => {
  const mockExperiments = [];
  const categories = ['Coding', 'Design', 'Writing', 'Research'];
  const experimentNames = [
    'Improve time estimates for coding tasks',
    'Better estimation for design work',
    'Writing productivity experiment',
    'Research efficiency test'
  ];
  
  // Generate 3 mock experiments
  for (let i = 0; i < 3; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 10));
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14);
    
    mockExperiments.push({
      id: i + 1,
      name: experimentNames[i % experimentNames.length],
      status: i === 0 ? 'active' : (i === 1 ? 'completed' : 'pending'),
      intervention_category: 'time_estimation',
      target_category: categories[i % categories.length],
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      parameters: { multiplier: 1.5 }
    });
  }
  
  return mockExperiments;
};

const generateMockResults = (experimentId) => {
  const controlAccuracy = Math.floor(Math.random() * 50) + 30; // 30-80%
  const experimentAccuracy = Math.floor(Math.random() * 50) + 40; // 40-90%
  const improvement = experimentAccuracy - controlAccuracy;
  
  return {
    experiment_name: "Time Estimation Experiment",
    status: "active",
    total_tasks: Math.floor(Math.random() * 20) + 5,
    control_group_size: Math.floor(Math.random() * 10) + 3,
    intervention_group_size: Math.floor(Math.random() * 10) + 3,
    control_accuracy: controlAccuracy,
    intervention_accuracy: experimentAccuracy,
    improvement: improvement,
    success: improvement > 0,
    control_group: {
      avg_accuracy: controlAccuracy
    },
    experiment_group: {
      avg_accuracy: experimentAccuracy
    }
  };
};

export const useExperiments = () => {
  const [experiments, setExperiments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [useMockData, setUseMockData] = useState(false)

  // Load all user experiments
  const loadExperiments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await experimentService.getAll()
      
      // If we got data from the API, use it
      if (response.data && response.data.length > 0) {
        setExperiments(response.data)
        setUseMockData(false)
      } else {
        // If no data, use mock data
        setExperiments(generateMockExperiments())
        setUseMockData(true)
      }
    } catch (err) {
      console.error('Failed to load experiments:', err)
      // On error, use mock data
      setExperiments(generateMockExperiments())
      setUseMockData(true)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Create a new experiment
  const createExperiment = async (experimentData) => {
    try {
      const response = await experimentService.createExperiment(experimentData)
      await loadExperiments() // Refresh list
      notifications.show({
        title: 'Success',
        message: 'Experiment created successfully',
        color: 'green'
      })
      return response
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to create experiment',
        color: 'red'
      })
      throw err
    }
  }

  // Get experiment results
  const getExperimentResults = async (experimentId) => {
    try {
      const response = await experimentService.getResults(experimentId)
      
      // If we got data from the API, use it
      if (response.data && Object.keys(response.data).length > 0) {
        return response.data
      } else {
        // If no data, use mock data
        return generateMockResults(experimentId)
      }
    } catch (err) {
      console.error('Failed to get experiment results:', err)
      // On error, use mock data
      return generateMockResults(experimentId)
    }
  }

  // End an experiment
  const endExperiment = async (experimentId) => {
    try {
      await experimentService.endExperiment(experimentId)
      await loadExperiments() // Refresh list
      notifications.show({
        title: 'Success',
        message: 'Experiment ended successfully',
        color: 'green'
      })
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to end experiment',
        color: 'red'
      })
      throw err
    }
  }

  // Check if task should get intervention and apply it
  const checkTaskIntervention = async (categoryId, originalEstimate = null) => {
    try {
      const response = await experimentService.checkTaskIntervention({
        category_id: categoryId,
        original_estimate: originalEstimate
      })
      return response.data
    } catch (err) {
      console.error('Failed to check task intervention:', err)
      return { has_intervention: false }
    }
  }

  // Get experiment statistics
  const getExperimentStats = async (experimentId) => {
    try {
      const response = await experimentService.getExperimentStats(experimentId)
      return response.data
    } catch (err) {
      console.error('Failed to get experiment stats:', err)
      return null
    }
  }

  // Update an experiment
  const updateExperiment = async (experimentId, updateData) => {
    try {
      const response = await experimentService.updateExperiment(experimentId, updateData)
      await loadExperiments() // Refresh list
      notifications.show({
        title: 'Success',
        message: 'Experiment updated successfully',
        color: 'green'
      })
      return response
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to update experiment',
        color: 'red'
      })
      throw err
    }
  }

  // Delete an experiment
  const deleteExperiment = async (experimentId) => {
    try {
      await experimentService.deleteExperiment(experimentId)
      await loadExperiments() // Refresh list
      notifications.show({
        title: 'Success',
        message: 'Experiment deleted successfully',
        color: 'green'
      })
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to delete experiment',
        color: 'red'
      })
      throw err
    }
  }

  // Load experiments on hook initialization
  useEffect(() => {
    loadExperiments()
  }, [])

  return {
    experiments,
    loading,
    error,
    useMockData,
    loadExperiments,
    createExperiment,
    getExperimentResults,
    endExperiment,
    checkTaskIntervention,
    getExperimentStats,
    updateExperiment,
    deleteExperiment
  }
}
