import {
  Alert,
  Button,
  Container,
  Divider,
  Group,
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle, IconBrandGoogle } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

const Login = () => {
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { login, register, googleLogin, isLoading, error, clearError } = useAuth()
  const navigate = useNavigate()

  const form = useForm({
    initialValues: {
      login: '',
      email: '',
      username: '',
      password: '',
      firstName: '',
      lastName: ''
    },
    validate: {
      email: isLoginMode ? undefined : (value) => 
        /^\S+@\S+$/.test(value) ? null : 'Invalid email',
      firstName: isLoginMode ? undefined : (value) => 
        value.length > 0 ? null : 'First name is required',
      lastName: isLoginMode ? undefined : (value) => 
        value.length > 0 ? null : 'Last name is required',
      username: isLoginMode ? undefined : (value) => 
        value.length >= 3 ? null : 'Username must be at least 3 characters',
      password: (value) => 
        value.length >= 6 ? null : 'Password must be at least 6 characters'
    }
  })

  // Load Google Identity Services script
  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) return // Already loaded

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initializeGoogleSignIn
      document.head.appendChild(script)
    }

    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        })
      }
    }

    loadGoogleScript()
  }, [])

  const handleGoogleResponse = async (response) => {
    try {
      setGoogleLoading(true)
      await googleLogin(response.credential)
      navigate('/dashboard')
    } catch (err) {
      console.error('Google login error:', err)
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.prompt()
    } else {
      console.error('Google Sign-In not loaded')
    }
  }

  const handleSubmit = async (values) => {
    try {
      if (isLoginMode) {
        await login({
          login: values.login,
          password: values.password
        })
      } else {
        await register({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          username: values.username,
          password: values.password
        })
      }
      navigate('/dashboard')
    } catch (err) {
      console.error('Auth error:', err)
    }
  }

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
    clearError()
    form.reset()
  }

  return (
    <Container size={420} my={40}>
      <Title ta="center" order={2}>
        {isLoginMode ? 'Welcome back!' : 'Create account'}
      </Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {error && (
              <Alert 
                icon={<IconAlertCircle size="1rem" />} 
                title="Error" 
                color="red"
                variant="light"
              >
                {error}
              </Alert>
            )}

            {/* Google OAuth Button */}
            <Button
              leftSection={<IconBrandGoogle size={16} />}
              variant="outline"
              color="red"
              onClick={handleGoogleSignIn}
              loading={googleLoading}
              fullWidth
              size="md"
            >
              {isLoginMode ? 'Sign in with Google' : 'Sign up with Google'}
            </Button>

            <Divider 
              label={
                <Text size="sm" c="dimmed">
                  Or continue with email
                </Text>
              } 
              labelPosition="center" 
            />

            {isLoginMode ? (
              // Login fields
              <>
                <TextInput
                  label="Email or Username"
                  placeholder="Enter your email or username"
                  required
                  {...form.getInputProps('login')}
                />
                <PasswordInput
                  label="Password"
                  placeholder="Enter your password"
                  required
                  {...form.getInputProps('password')}
                />
              </>
            ) : (
              // Registration fields
              <>
                <SimpleGrid cols={2}>
                  <TextInput
                    label="First Name"
                    placeholder="First name"
                    required
                    {...form.getInputProps('firstName')}
                  />
                  <TextInput
                    label="Last Name"
                    placeholder="Last name"
                    required
                    {...form.getInputProps('lastName')}
                  />
                </SimpleGrid>
                
                <TextInput
                  label="Email"
                  placeholder="Enter your email"
                  required
                  {...form.getInputProps('email')}
                />
                
                <TextInput
                  label="Username"
                  placeholder="Choose a username"
                  required
                  {...form.getInputProps('username')}
                />
                
                <PasswordInput
                  label="Password"
                  placeholder="Create a password"
                  required
                  {...form.getInputProps('password')}
                />
              </>
            )}

            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              mt="sm"
            >
              {isLoginMode ? 'Sign in' : 'Sign up'}
            </Button>

            <Group justify="center" mt="sm">
              <Button 
                variant="subtle" 
                onClick={toggleMode}
                size="sm"
              >
                {isLoginMode 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}

export default Login