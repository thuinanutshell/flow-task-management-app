// frontend/src/services/experiments.js
import api, { apiCall } from './api'

class ExperimentService {
  // Get all experiments for the current user
  async getAll() {
    return apiCall(() => api.get('/experiment/'))
  }

  // Create a new experiment
  async createExperiment(experimentData) {
    return apiCall(() => 
      api.post('/experiment/create', {
        name: experimentData.name,
        category_id: experimentData.categoryId,
        experiment_type: experimentData.experimentType,
        duration_days: experimentData.durationDays || 14
      })
    )
  }

  // Get experiment results
  async getResults(experimentId) {
    return apiCall(() => api.get(`/experiment/${experimentId}/results`))
  }

  // Check if task should receive intervention
  async checkTaskIntervention(data) {
    return apiCall(() => 
      api.post('/experiment/task-intervention', data)
    )
  }

  // End/stop an experiment
  async endExperiment(experimentId) {
    return apiCall(() => 
      api.patch(`/experiment/${experimentId}`, {
        status: 'completed'
      })
    )
  }

  // Get experiment statistics
  async getExperimentStats(experimentId) {
    return apiCall(() => api.get(`/experiment/${experimentId}/stats`))
  }

  // Delete an experiment
  async deleteExperiment(experimentId) {
    return apiCall(() => api.delete(`/experiment/${experimentId}`))
  }
}

// Export singleton instance
export const experimentService = new ExperimentService()
export default experimentService
