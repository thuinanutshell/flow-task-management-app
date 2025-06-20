import { Card, Container, Text, Title } from '@mantine/core'

const Analytics = () => {
  return (
    <Container size="xl">
      <Title order={1} mb="md">Analytics</Title>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text>Analytics page - Coming soon!</Text>
        <Text size="sm" c="dimmed" mt="sm">
          This is where you'll see your productivity insights and time tracking data.
        </Text>
      </Card>
    </Container>
  )
}

export default Analytics