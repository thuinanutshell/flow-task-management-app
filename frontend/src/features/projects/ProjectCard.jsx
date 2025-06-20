import {
    Badge,
    Card,
    Group,
    Stack,
    Text
} from '@mantine/core'
import {
    IconClock,
    IconList
} from '@tabler/icons-react'

const ProjectCard = ({ 
  project, 
  onEdit, 
  onDelete, 
  onView,
  onClick 
}) => {
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'not_started': return 'gray'
      case 'in_progress': return 'blue'
      case 'pending': return 'orange'
      case 'done': return 'green'
      default: return 'gray'
    }
  }

  // Format status text
  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick(project)
    }
  }

  return (
    <Card 
      shadow="sm" 
      padding="lg" 
      radius="md" 
      withBorder
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={handleCardClick}
    >
      <Stack spacing="sm">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Text fw={500} size="md" lineClamp={2}>
            {project.name}
          </Text>
          
          <Group spacing="xs">
            <Badge 
              color={getStatusColor(project.status)} 
              variant="light"
              size="sm"
            >
              {formatStatus(project.status)}
            </Badge>
          </Group>
        </Group>

        {/* Description */}
        {project.description && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {project.description}
          </Text>
        )}

        {/* Stats */}
        <Group spacing="md">
          <Group spacing="xs">
            <IconList size={14} color="#868e96" />
            <Text size="sm" c="dimmed">
              {project.total_lists || 0} lists
            </Text>
          </Group>
          
          <Group spacing="xs">
            <IconClock size={14} color="#868e96" />
            <Text size="sm" c="dimmed">
              {project.total_tasks || 0} tasks
            </Text>
          </Group>
        </Group>

      </Stack>
    </Card>
  )
}

export default ProjectCard