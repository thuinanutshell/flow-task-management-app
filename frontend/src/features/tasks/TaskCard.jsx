// features/tasks/TaskCard.jsx
import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Group,
    Menu,
    Progress,
    Stack,
    Text
} from '@mantine/core'
import {
    IconCheck,
    IconClock,
    IconDots,
    IconEdit,
    IconFlag,
    IconPause,
    IconPlay,
    IconTrash
} from '@tabler/icons-react'

const TaskCard = ({ 
  task, 
  onEdit, 
  onDelete, 
  onStartTimer,
  onPauseTimer,
  onCompleteTask,
  onClick 
}) => {
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'not_started': return 'gray'
      case 'active': return 'blue'
      case 'paused': return 'orange'
      case 'done': return 'green'
      default: return 'gray'
    }
  }

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'yellow'
      case 'low': return 'green'
      default: return 'gray'
    }
  }

  // Format status text
  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // Get time efficiency
  const getTimeEfficiency = () => {
    if (task.total_time_worked === 0) return null
    const efficiency = (task.planned_duration / task.total_time_worked) * 100
    return Math.round(efficiency)
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick(task)
    }
  }

  const renderActionButton = () => {
    switch (task.status) {
      case 'not_started':
      case 'paused':
        return (
          <Button
            size="xs"
            leftSection={<IconPlay size={14} />}
            onClick={(e) => {
              e.stopPropagation()
              onStartTimer && onStartTimer(task)
            }}
          >
            {task.status === 'not_started' ? 'Start' : 'Resume'}
          </Button>
        )
      
      case 'active':
        return (
          <Group spacing="xs">
            <Button
              size="xs"
              variant="outline"
              leftSection={<IconPause size={14} />}
              onClick={(e) => {
                e.stopPropagation()
                onPauseTimer && onPauseTimer(task)
              }}
            >
              Pause
            </Button>
            <Button
              size="xs"
              color="green"
              leftSection={<IconCheck size={14} />}
              onClick={(e) => {
                e.stopPropagation()
                onCompleteTask && onCompleteTask(task)
              }}
            >
              Done
            </Button>
          </Group>
        )
      
      case 'done':
        return (
          <Badge color="green" variant="light">
            <IconCheck size={12} style={{ marginRight: 4 }} />
            Completed
          </Badge>
        )
      
      default:
        return null
    }
  }

  const efficiency = getTimeEfficiency()

  return (
    <Card 
      shadow="sm" 
      padding="md" 
      radius="md" 
      withBorder
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={handleCardClick}
    >
      <Stack spacing="sm">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div style={{ flex: 1 }}>
            <Text fw={500} size="sm" lineClamp={2}>
              {task.name}
            </Text>
            {task.description && (
              <Text size="xs" c="dimmed" lineClamp={2} mt="xs">
                {task.description}
              </Text>
            )}
          </div>
          
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon 
                variant="subtle" 
                color="gray"
                size="sm"
                onClick={(e) => e.stopPropagation()}
              >
                <IconDots size={14} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              {onEdit && (
                <Menu.Item 
                  leftSection={<IconEdit size={14} />}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(task)
                  }}
                >
                  Edit Task
                </Menu.Item>
              )}
              
              {onDelete && (
                <Menu.Item 
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(task)
                  }}
                >
                  Delete Task
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>

        {/* Status and Priority */}
        <Group justify="space-between">
          <Badge 
            color={getStatusColor(task.status)} 
            variant="light"
            size="sm"
          >
            {formatStatus(task.status)}
          </Badge>
          
          <Badge 
            color={getPriorityColor(task.priority)} 
            variant="outline"
            size="sm"
            leftSection={<IconFlag size={10} />}
          >
            {task.priority}
          </Badge>
        </Group>

        {/* Time Info */}
        <Stack spacing="xs">
          <Group justify="space-between">
            <Group spacing="xs">
              <IconClock size={12} color="#868e96" />
              <Text size="xs" c="dimmed">
                Planned: {task.planned_duration}m
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              Worked: {task.total_time_worked}m
            </Text>
          </Group>
          
          {/* Time Progress Bar */}
          {task.total_time_worked > 0 && (
            <div>
              <Progress 
                value={Math.min((task.total_time_worked / task.planned_duration) * 100, 100)}
                color={efficiency && efficiency >= 100 ? 'green' : 'blue'}
                size="xs"
              />
              {efficiency && (
                <Text size="xs" c="dimmed" ta="center" mt="xs">
                  Efficiency: {efficiency}%
                </Text>
              )}
            </div>
          )}
        </Stack>

        {/* Action Button */}
        <Group justify="center">
          {renderActionButton()}
        </Group>

        {/* Completion Info */}
        {task.status === 'done' && task.completed_at && (
          <Text size="xs" c="dimmed" ta="center">
            Completed: {new Date(task.completed_at).toLocaleDateString()}
          </Text>
        )}
      </Stack>
    </Card>
  )
}

export default TaskCard