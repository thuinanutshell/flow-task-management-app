import { Card, Container, Text, Title } from '@mantine/core'

const Calendar = () => {
  return (
    <Container size="xl">
      <Title order={1} mb="md">Calendar</Title>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text>Calendar page - Coming soon!</Text>
        <Text size="sm" c="dimmed" mt="sm">
          This is where you'll view your scheduled tasks and deadlines.
        </Text>
      </Card>
    </Container>
  )
}

export default Calendar