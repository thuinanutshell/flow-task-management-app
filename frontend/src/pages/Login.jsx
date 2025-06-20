// pages/Login.jsx
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [formData, setFormData] = useState({
    login: '', // This will be email or username for login
    email: '', // For registration
    username: '', // For registration
    password: '',
    firstName: '', // For registration
    lastName: '' // For registration
  })
  
  const { login, register, isLoading, error, clearError } = useAuth()
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (error) {
      clearError()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (isLoginMode) {
        // Login with email or username
        await login({
          login: formData.login,
          password: formData.password
        })
      } else {
        // Register new user
        await register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          username: formData.username,
          password: formData.password
        })
      }
      
      // Redirect to dashboard on success
      navigate('/dashboard')
    } catch (err) {
      // Error is already handled by the auth context
      console.error('Auth error:', err)
    }
  }

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
    clearError()
    // Reset form
    setFormData({
      login: '',
      email: '',
      username: '',
      password: '',
      firstName: '',
      lastName: ''
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {isLoginMode ? 'Sign in to your account' : 'Create your account'}
          </CardTitle>
          <CardDescription className="text-center">
            {isLoginMode 
              ? 'Enter your credentials to access your tasks' 
              : 'Fill in your information to get started'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {isLoginMode ? (
              // Login fields
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login">Email or Username</Label>
                  <Input
                    id="login"
                    name="login"
                    type="text"
                    required
                    value={formData.login}
                    onChange={handleInputChange}
                    placeholder="Enter your email or username"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                  />
                </div>
              </div>
            ) : (
              // Registration fields
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="First name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Choose a username"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a password"
                  />
                </div>
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Loading...' : (isLoginMode ? 'Sign in' : 'Sign up')}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={toggleMode}
                className="text-sm"
              >
                {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login