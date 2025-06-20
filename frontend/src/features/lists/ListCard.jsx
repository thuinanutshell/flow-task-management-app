import {
    ActionIcon,
    Badge,
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
    IconExternalLink,
    IconPlus,
    IconTrash,
    IconX
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listService } from '../../services/lists'
import TaskCardCompact from '../tasks/TaskCardCompact'

const ListCard = ({ 
  list, 
  onAddTask,
  onEdit, 
  onDelete,
  onRemoveFromWorkspace,
  isWorkspaceList = false
}) => {
  const navigate = useNavigate()
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

  const handleViewInProject = () => {
    if (list.project_id || list.originalProjectId) {
      const projectId = list.project_id || list.originalProjectId
      navigate(`/projects/${projectId}`)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(list)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(list)
    }
  }

  const handleRemoveFromWorkspace = () => {
    if (onRemoveFromWorkspace) {
      onRemoveFromWorkspace(list)
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
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6'
      }}
    >
      {/* List Header */}
      <Group 
        justify="space-between" 
        align="center" 
        p="md"
        style={{ borderBottom: '1px solid #dee2e6' }}
      >
        {/* List Name and Type Indicator */}
        <Stack spacing={4} style={{ flex: 1 }}>
          <Group spacing="xs" align="center">
            <Text fw={600} size="md" lineClamp={1}>
              {list.name}
            </Text>
          </Group>
        </Stack>

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
          
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon 
                variant="subtle" 
                color="gray"
              >
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              {/* View in Project - Only for workspace lists */}
              {isWorkspaceList && (list.project_id || list.originalProjectId) && (
                <Menu.Item 
                  leftSection={<IconExternalLink size={14} />}
                  onClick={handleViewInProject}
                >
                  View in Project
                </Menu.Item>
              )}
              
              {/* Edit List - Only for created lists */}
              {!isWorkspaceList && onEdit && (
                <Menu.Item 
                  leftSection={<IconEdit size={14} />}
                  onClick={handleEdit}
                >
                  Edit List
                </Menu.Item>
              )}
              
              {/* Remove from Workspace - Only for workspace lists */}
              {isWorkspaceList && onRemoveFromWorkspace && (
                <Menu.Item 
                  leftSection={<IconX size={14} />}
                  color="orange"
                  onClick={handleRemoveFromWorkspace}
                >
                  Remove from Workspace
                </Menu.Item>
              )}
              
              {/* Delete List - Only for created lists */}
              {!isWorkspaceList && onDelete && (
                <Menu.Item 
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={handleDelete}
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