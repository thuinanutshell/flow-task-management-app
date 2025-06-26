import axios from 'axios'

// Create base API instance
const api = axios.create({
  baseURL: 'https://flow-backend.up.railway.app',  // Added https://
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 second timeout
})

// Request interceptor - automatically add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => {
    // If response is successful, just return it
    return response
  },
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('access_token')
          localStorage.removeItem('user')
          window.location.href = '/login'
          break
        case 403:
          // Forbidden - user doesn't have permission
          console.error('Access forbidden:', data.message)
          break
        case 500:
          // Server error
          console.error('Server error:', data.message)
          break
        default:
          console.error('API Error:', data.message || 'Unknown error')
      }
    } else if (error.request) {
      // Network error - no response received
      console.error('Network error - no response received')
    } else {
      // Something else happened
      console.error('Error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

// Helper function to handle API responses consistently
export const handleApiResponse = (response) => {
  // Your backend returns: { success: true, message: "...", data: {...} }
  if (response.data.success) {
    return response.data
  } else {
    throw new Error(response.data.message || 'API request failed')
  }
}

// Helper function for making API calls with consistent error handling
export const apiCall = async (apiFunction) => {
  try {
    const response = await apiFunction()
    return handleApiResponse(response)
  } catch (error) {
    // Re-throw with a consistent error format
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'An unexpected error occurred'
    )
  }
}

export default api