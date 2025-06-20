import { Card, Container, Text, Title } from '@mantine/core';

const Experiments = () => {
  return (
    <Container size="xl">
      <Title order={1} mb="md">Experiments</Title>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text>Experiments page - Coming soon!</Text>
        <Text size="sm" c="dimmed" mt="sm">
          This is where you'll try new productivity techniques and methods.
        </Text>
      </Card>
    </Container>
  )
}

export default Experiments;