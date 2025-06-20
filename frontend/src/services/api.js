import axios from 'axios'

const api = axios.create({
    baseURL: 'http://127.0.0.1:5001',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000
})

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

api.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        if (error.response) {
            const { status, data } = error.response

        switch (status) {
            case 401:
                // Unauthorized - clear token and refirect to login
                localStorage.removeItem('access_token')
                localStorage.removeItem('user')
                window.location.href='/login'
                break
            case 403:
                // Forbidden
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
        console.error('Network error - no response received')
    } else {
        console.error('Error:', error.message)
    }
    return Promise.reject(error)
}
)

export const handleApiResponse = (response) => {
    if  (response.data.success) {
        return response.data
    } else {
        throw new Error(response.data.message || 'API request failed')
    }
}

export const apiCall = async (apiFunction) => {
    try {
        const response = await apiFunction()
        return handleApiResponse(response)
    } catch (error) {
        throw new Error(
            error.response?.data?.message ||
            error.message ||
            'An unexpected error occurred'
        )
    }
}

export default api;