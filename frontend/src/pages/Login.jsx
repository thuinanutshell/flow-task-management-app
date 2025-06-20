// pages/Login.jsx - Mantine version
import {
  Alert,
  Button,
  Container,
  Group,
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  TextInput,
  Title
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [isLoginMode, setIsLoginMode] = useState(true)
  const { login, register, isLoading, error, clearError } = useAuth()
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