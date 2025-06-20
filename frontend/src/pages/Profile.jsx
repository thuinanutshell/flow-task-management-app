import { Badge, Card, Container, Group, Stack, Text, Title } from '@mantine/core'
import { useAuth } from '../context/AuthContext'

const Profile = () => {
  const { user } = useAuth()

  return (
    <Container size="xl">
      <Title order={1} mb="md">Profile</Title>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack spacing="md">
          <Group justify="space-between">
            <Title order={3}>User Information</Title>
            <Badge color="green" variant="light">Active</Badge>
          </Group>
          
          <div>
            <Text size="sm" fw={500} c="dimmed">Full name</Text>
            <Text size="sm">{user?.first_name} {user?.last_name}</Text>
          </div>
          
          <div>
            <Text size="sm" fw={500} c="dimmed">Email</Text>
            <Text size="sm">{user?.email}</Text>
          </div>
          
          <div>
            <Text size="sm" fw={500} c="dimmed">Username</Text>
            <Text size="sm">{user?.username}</Text>
          </div>
          
          <Text size="sm" c="dimmed">
            Profile settings and preferences will be available here.
          </Text>
        </Stack>
      </Card>
    </Container>
  )
}

export default Profile
