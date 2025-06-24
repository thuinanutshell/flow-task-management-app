import { Container, Stack, Text, Title } from '@mantine/core'
import SimpleCalendar from '../components/SimpleCalendar'

const Calendar = () => {
  return (
    <Container size="xl">
      <Stack spacing="lg">
        <div>
          <Title order={1}>Calendar</Title>
          <Text c="dimmed" size="lg" mt="xs">
            Track your daily task completion rates
          </Text>
        </div>
        
        <SimpleCalendar />
      </Stack>
    </Container>
  )
}

export default Calendar