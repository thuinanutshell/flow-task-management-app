// services/analytics.js
import api, { apiCall } from './api'

class AnalyticsService {
  // Get daily completion rate for a specific date
  async getDailyCompletionRate(date) {
    // Format date as YYYY-MM-DD
    const dateString = date instanceof Date ? date.toISOString().split('T')[0] : date
    return apiCall(() => api.get(`/analytics/daily/${dateString}`))
  }

  // Get completion rates for an entire month
  async getMonthlyCompletionRates(year, month) {
    return apiCall(() => api.get(`/analytics/daily/month/${year}/${month}`))
  }

  // Get analytics for a specific category (comprehensive)
  async getCategoryAnalytics(categoryId, dateRange = null) {
    const params = new URLSearchParams()
    if (dateRange?.start_date) params.append('start_date', dateRange.start_date)
    if (dateRange?.end_date) params.append('end_date', dateRange.end_date)
    
    const queryString = params.toString()
    const url = `/analytics/categories/${categoryId}${queryString ? `?${queryString}` : ''}`
    
    return apiCall(() => api.get(url))
  }

  // Get comprehensive analytics for all categories
  async getAllCategoriesAnalytics(dateRange = null) {
    try {
      // First get all categories
      const categoriesResponse = await apiCall(() => api.get('/categories/'))
      const categories = categoriesResponse.data || []
      
      // Get comprehensive analytics for each category
      const categoryAnalytics = await Promise.all(
        categories.map(async (category) => {
          try {
            const analytics = await this.getCategoryAnalytics(category.id, dateRange)
            return analytics.data
          } catch (error) {
            console.error(`Failed to load analytics for category ${category.id}:`, error)
            // Return basic category info with empty analytics if it fails
            return {
              category: {
                id: category.id,
                name: category.name,
                color: category.color
              },
              completion_rate: 0,
              completion_percentage: 0,
              estimation_accuracy: {
                accuracy_percentage: 0,
                total_tasks_analyzed: 0,
                underestimated_count: 0,
                overestimated_count: 0,
                accurate_count: 0
              },
              mental_state_distribution: {
                total_tasks: 0,
                mental_states: { counts: {}, percentages: {} },
                most_common_state: null,
                positive_states_percentage: 0
              }
            }
          }
        })
      )
      
      return {
        success: true,
        data: {
          categories: categoryAnalytics,
          date_range: dateRange
        }
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to load categories analytics')
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService()
export default analyticsService