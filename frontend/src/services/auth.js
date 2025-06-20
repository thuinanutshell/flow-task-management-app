// services/auth.js
import api, { apiCall } from './api'

class AuthService {
  // Register new user
  async register(userData) {
    // Your backend expects: first_name, last_name, email, username, password
    return apiCall(() => 
      api.post('/auth/register', {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        username: userData.username,
        password: userData.password
      })
    )
  }

  // Login user
  async login(credentials) {
    // Your backend expects 'login' field (email or username) and 'password'
    const loginData = {
      login: credentials.email || credentials.username || credentials.login,
      password: credentials.password
    }
    
    const response = await apiCall(() => 
      api.post('/auth/login', loginData)
    )
    
    // Store token and user data in localStorage
    // Your backend returns: { success: true, data: { token: "...", user: {...} } }
    if (response.data.token) {
      localStorage.setItem('access_token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    
    return response
  }

  // Logout user
  logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    // Redirect to login page
    window.location.href = '/login'
  }

  // Get current user from localStorage
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('Error parsing user data:', error)
      return null
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('access_token')
    const user = this.getCurrentUser()
    return !!(token && user)
  }

  // Get auth token
  getToken() {
    return localStorage.getItem('access_token')
  }

  // Refresh user profile (get current user info)
  async getProfile() {
    return apiCall(() => api.get('/auth/profile'))
  }

  // Update profile
  async updateProfile(profileData) {
    const response = await apiCall(() => 
      api.patch('/auth/update', profileData)
    )
    
    // Update stored user data
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data))
    }
    
    return response
  }

  // Google OAuth login
  async googleLogin(idToken) {
    const response = await apiCall(() => 
      api.post('/auth/oauth/google', { id_token: idToken })
    )
    
    // Store token and user data
    if (response.data.token) {
      localStorage.setItem('access_token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    
    return response
  }

  // Delete account
  async deleteAccount() {
    return apiCall(() => api.delete('/auth/delete'))
  }

  // Verify token is still valid
  async verifyToken() {
    try {
      return await apiCall(() => api.get('/auth/profile'))
    } catch (error) {
      // Token is invalid, logout user
      this.logout()
      throw error
    }
  }

  // Logout user (calls backend to revoke token)
  async logoutFromServer() {
    try {
      await apiCall(() => api.post('/auth/logout'))
    } catch (error) {
      // Even if server logout fails, we still clear local storage
      console.error('Server logout failed:', error)
    } finally {
      this.logout() // Clear local storage regardless
    }
  }
}

// Export singleton instance
export const authService = new AuthService()
export default authService