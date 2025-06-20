import {
    ActionIcon,
    Box,
    Group,
    Menu,
    Paper,
    ScrollArea,
    Stack,
    Text
} from '@mantine/core'
import {
    IconDots,
    IconEdit,
    IconPlus,
    IconTrash
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { listService } from '../../services/lists'
import TaskCardCompact from '../tasks/TaskCardCompact'

const ListCard = ({ 
  list, 
  onAddTask,
  onEdit, 
  onDelete
}) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Load tasks for this list
  useEffect(() => {
    loadListTasks()
  }, [list.id])

  const loadListTasks = async () => {
    try {
      setLoading(true)
      const response = await listService.getListById(list.id)
      setTasks(response.data.tasks || [])
    } catch (error) {
      console.error('Failed to load tasks:', error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  // Calculate progress percentage
  const progressPercentage = list.total_tasks > 0 
    ? Math.round(((list.completed_tasks || 0) / list.total_tasks) * 100)
    : 0

  const handleAddTask = (e) => {
    e.stopPropagation()
    if (onAddTask) {
      onAddTask(list)
    }
  }

  return (
    <Paper 
      shadow="sm" 
      radius="md" 
      withBorder
      style={{
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8f9fa'
      }}
    >
      {/* List Header */}
      <Group 
        justify="space-between" 
        align="center" 
        p="md"
        style={{ borderBottom: '1px solid #dee2e6' }}
      >
        {/* Progress Ring + List Name */}
        <Group spacing="sm" style={{ flex: 1 }}>
          <Text fw={600} size="md" lineClamp={1}>
            {list.name}
          </Text>
        </Group>

        {/* Action Buttons */}
        <Group spacing="xs">
          <ActionIcon 
            variant="subtle" 
            color="blue"
            onClick={handleAddTask}
            title="Add Task"
          >
            <IconPlus size={16} />
          </ActionIcon>
          
          <Menu shadow="md" width={180}>
            <Menu.Target>
              <ActionIcon 
                variant="subtle" 
                color="gray"
              >
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              {onEdit && (
                <Menu.Item 
                  leftSection={<IconEdit size={14} />}
                  onClick={() => onEdit(list)}
                >
                  Edit List
                </Menu.Item>
              )}
              
              {onDelete && (
                <Menu.Item 
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={() => onDelete(list)}
                >
                  Delete List
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Tasks Container */}
      <ScrollArea style={{ flex: 1 }} p="sm">
        <Stack spacing="sm">
          {loading ? (
            <Text size="sm" c="dimmed" ta="center" py="md">
              Loading tasks...
            </Text>
          ) : tasks.length === 0 ? (
            <Box
              p="md"
              style={{
                textAlign: 'center',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '2px dashed #dee2e6'
              }}
            >
              <Text size="sm" c="dimmed">
                No tasks yet
              </Text>
              <Text size="xs" c="dimmed" mt="xs">
                Click + to add your first task
              </Text>
            </Box>
          ) : (
            tasks.map((task) => (
              <TaskCardCompact 
                key={task.id} 
                task={task}
                onUpdate={loadListTasks}
              />
            ))
          )}
        </Stack>
      </ScrollArea>
    </Paper>
  )
}

export default ListCard