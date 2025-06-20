// features/lists/ListCard.jsx
import {
    ActionIcon,
    Card,
    Group,
    Menu,
    RingProgress,
    Stack,
    Text
} from '@mantine/core'
import {
    IconDots,
    IconEdit,
    IconEye,
    IconPlus,
    IconTrash
} from '@tabler/icons-react'

const ListCard = ({ 
  list, 
  onAddTask,
  onEdit, 
  onDelete, 
  onView,
  onClick 
}) => {
  
  // Calculate progress percentage
  const progressPercentage = list.total_tasks > 0 
    ? Math.round(((list.completed_tasks || 0) / list.total_tasks) * 100)
    : 0

  // Get progress color based on percentage
  const getProgressColor = (percentage) => {
    if (percentage === 0) return '#e9ecef'
    if (percentage < 30) return '#fa5252'
    if (percentage < 70) return '#fd7e14'
    return '#51cf66'
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick(list)
    }
  }

  const handleAddTask = (e) => {
    e.stopPropagation()
    if (onAddTask) {
      onAddTask(list)
    }
  }

  return (
    <Card 
      shadow="sm" 
      padding="lg" 
      radius="md" 
      withBorder
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        minHeight: '280px',
        maxHeight: '350px',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={handleCardClick}
    >
      <Stack justify="space-between" style={{ height: '100%' }}>
        {/* Header */}
        <div>
          <Group justify="space-between" align="flex-start" mb="md">
            <div style={{ flex: 1 }}>
              <Text fw={600} size="lg" lineClamp={2} mb="xs">
                {list.name}
              </Text>
              {list.project_name && (
                <Text size="xs" c="dimmed">
                  {list.project_name}
                </Text>
              )}
            </div>
            
            <Group spacing="xs">
              {/* Add Task Button */}
              <ActionIcon 
                variant="subtle" 
                color="blue"
                onClick={handleAddTask}
                title="Add Task"
              >
                <IconPlus size={16} />
              </ActionIcon>
              
              {/* Menu */}
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <ActionIcon 
                    variant="subtle" 
                    color="gray"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  {onView && (
                    <Menu.Item 
                      leftSection={<IconEye size={14} />}
                      onClick={(e) => {
                        e.stopPropagation()
                        onView(list)
                      }}
                    >
                      View Tasks
                    </Menu.Item>
                  )}
                  
                  {onEdit && (
                    <Menu.Item 
                      leftSection={<IconEdit size={14} />}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(list)
                      }}
                    >
                      Edit List
                    </Menu.Item>
                  )}
                  
                  {onDelete && (
                    <Menu.Item 
                      leftSection={<IconTrash size={14} />}
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(list)
                      }}
                    >
                      Delete List
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>

          {/* Progress Ring */}
          <Group justify="center" mb="md">
            <RingProgress
              size={80}
              thickness={8}
              sections={[
                { 
                  value: progressPercentage, 
                  color: getProgressColor(progressPercentage)
                }
              ]}
              label={
                <Text c="dimmed" fw={700} ta="center" size="sm">
                  {progressPercentage}%
                </Text>
              }
            />
          </Group>

          {/* Task Stats */}
          <Stack spacing="xs" mb="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Total Tasks</Text>
              <Text size="sm" fw={500}>{list.total_tasks || 0}</Text>
            </Group>
            
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Completed</Text>
              <Text size="sm" fw={500} c="green">
                {list.completed_tasks || 0}
              </Text>
            </Group>
            
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Active</Text>
              <Text size="sm" fw={500} c="blue">
                {list.active_tasks || 0}
              </Text>
            </Group>
          </Stack>
        </div>
      </Stack>

      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </Card>
  )
}

export default ListCard