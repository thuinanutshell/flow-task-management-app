import {
    ActionIcon,
    Badge,
    Button,
    ColorSwatch,
    Divider,
    Group,
    Modal,
    Paper,
    Progress,
    Stack,
    Text,
    Title,
    Tooltip
} from '@mantine/core'
import {
    IconCalendar,
    IconCheck,
    IconClock,
    IconEdit,
    IconFlag,
    IconNotes,
    IconPlayerPause,
    IconPlayerPlay,
    IconTag,
    IconX
} from '@tabler/icons-react'
import { useState } from 'react'
import { useTimer } from '../../context/TimerContext'
import { useTasks } from '../../hooks/useTasks'
import CompleteTaskModal from './CompleteTaskModal'
import EditTaskModal from './EditTaskModal'

const TaskDetailModal = ({ 
  opened, 
  onClose, 
  task,
  onUpdate
}) => {
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const { taskOptions, updateTask, deleteTask } = useTasks()
  const { 
    activeTask, 
    isTimerActive, 
    startTimer, 
    pauseTimer, 
    completeTask,
    getFormattedTimeRemaining,
    getFormattedElapsedTime
  } = useTimer()

  if (!task) return null

  // Check if this task is the active one
  const isActiveTask = activeTask?.id === task.id
  const isThisTaskActive = isActiveTask && isTimerActive

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'yellow'
      case 'low': return 'green'
      default: return 'gray'
    }
  }

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

  // Format status text
  const formatStatus = (status) => {
    if (isThisTaskActive) {
      return `Active - ${getFormattedTimeRemaining()}`
    }
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // Get category information
  const getTaskCategory = () => {
    if (!task.category_id || !taskOptions?.categories) {
      return null
    }
    return taskOptions.categories.find(cat => cat.id === task.category_id)
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleString()
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!task.planned_duration) return 0
    return Math.min(100, (task.total_time_worked / task.planned_duration) * 100)
  }

  // Format mental state
  const formatMentalState = (state) => {
    if (!state) return null
    const stateMap = {
      'ENERGIZED': '⚡ Energized',
      'FOCUSED': '🎯 Focused', 
      'SATISFIED': '😊 Satisfied',
      'MOTIVATED': '🚀 Motivated',
      'TIRED': '😴 Tired',
      'FRUSTRATED': '😤 Frustrated',
      'ANXIOUS': '😰 Anxious'
    }
    return stateMap[state] || state
  }

  const handleStartTimer = async () => {
    try {
      await startTimer(task)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to start timer:', error)
    }
  }

  const handlePauseTimer = async () => {
    try {
      await pauseTimer()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to pause timer:', error)
    }
  }

  const handleCompleteTask = () => {
    setCompleteModalOpen(true)
  }

  const handleCompleteSubmit = async (mentalState, reflection) => {
    try {
      await completeTask(mentalState, reflection)
      setCompleteModalOpen(false)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const handleEditTask = () => {
    setEditModalOpen(true)
  }

  const handleEditSubmit = async (taskId, updateData) => {
    try {
      await updateTask(taskId, updateData)
      setEditModalOpen(false)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleDeleteTask = async () => {
    if (window.confirm(`Are you sure you want to delete "${task.name}"?`)) {
      try {
        await deleteTask(task.id)
        onClose()
        if (onUpdate) onUpdate()
      } catch (error) {
        console.error('Failed to delete task:', error)
      }
    }
  }

  const category = getTaskCategory()
  const progress = calculateProgress()

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group justify="space-between" style={{ width: '100%' }}>
            <Title order={3} size="xl">Task Details</Title>
            <Group spacing="xs">
              <Tooltip label="Edit Task">
                <ActionIcon 
                  variant="subtle" 
                  onClick={handleEditTask}
                  disabled={isThisTaskActive}
                >
                  <IconEdit size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete Task">
                <ActionIcon 
                  variant="subtle" 
                  color="red"
                  onClick={handleDeleteTask}
                  disabled={isThisTaskActive}
                >
                  <IconX size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        }
        size="lg"
        centered
      >
        <Stack spacing="lg">
          {/* Task Header */}
          <Paper p="md" withBorder radius="md">
            <Stack spacing="sm">
              <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Title order={4} size="lg" lineClamp={2}>
                    {task.name}
                  </Title>
                  {task.description && (
                    <Text size="md" c="dimmed" mt="xs">
                      {task.description}
                    </Text>
                  )}
                </div>
                
                <Group spacing="xs" align="center">
                  <Badge 
                    color={getPriorityColor(task.priority)} 
                    leftSection={<IconFlag size={10} />}
                  >
                    {task.priority}
                  </Badge>
                  <Badge 
                    color={getStatusColor(task.status)} 
                    variant="light"
                  >
                    {formatStatus(task.status)}
                  </Badge>
                </Group>
              </Group>

              {/* Category */}
              {category && (
                <Group spacing="xs" align="center">
                  <ColorSwatch color={category.color} size={16} />
                  <IconTag size={14} color="#868e96" />
                  <Text size="sm" c="dimmed">
                    {category.name}
                  </Text>
                </Group>
              )}
            </Stack>
          </Paper>

          {/* Time Information */}
          <Paper p="md" withBorder radius="md">
            <Stack spacing="md">
              <Title order={5} size="lg">⏱️ Time Tracking</Title>
              
              <Group grow>
                <div>
                  <Text size="sm" c="dimmed" fw={500}>PLANNED</Text>
                  <Group spacing="xs" align="center">
                    <IconClock size={16} color="#228be6" />
                    <Text size="md">{task.planned_duration} minutes</Text>
                  </Group>
                </div>
                
                <div>
                  <Text size="sm" c="dimmed" fw={500}>WORKED</Text>
                  <Group spacing="xs" align="center">
                    <IconCheck size={16} color="#40c057" />
                    <Text size="md">{task.total_time_worked || 0} minutes</Text>
                  </Group>
                </div>
                
                {isThisTaskActive && (
                  <div>
                    <Text size="sm" c="dimmed" fw={500}>CURRENT SESSION</Text>
                    <Group spacing="xs" align="center">
                      <IconPlayerPlay size={16} color="#fa5252" />
                      <Text size="md">{getFormattedElapsedTime()}</Text>
                    </Group>
                  </div>
                )}
              </Group>

              {/* Progress Bar */}
              <div>
                <Group justify="space-between" align="center" mb="xs">
                  <Text size="sm" c="dimmed" fw={500}>PROGRESS</Text>
                  <Text size="sm" c="dimmed">{Math.round(progress)}%</Text>
                </Group>
                <Progress 
                  value={progress} 
                  color={progress >= 100 ? 'green' : 'blue'}
                  size="md" 
                />
              </div>
            </Stack>
          </Paper>

          {/* Task Actions */}
          {task.status !== 'done' && (
            <Paper p="md" withBorder radius="md">
              <Stack spacing="sm">
                <Title order={5} size="lg">🎯 Actions</Title>
                
                <Group spacing="sm">
                  {task.status === 'not_started' || task.status === 'paused' ? (
                    <Button
                      leftSection={<IconPlayerPlay size={16} />}
                      onClick={handleStartTimer}
                      disabled={isTimerActive && !isActiveTask}
                      flex={1}
                    >
                      {task.status === 'not_started' ? 'Start Timer' : 'Resume Timer'}
                    </Button>
                  ) : task.status === 'active' ? (
                    <>
                      <Button
                        leftSection={<IconPlayerPause size={16} />}
                        variant="outline"
                        onClick={handlePauseTimer}
                        flex={1}
                      >
                        Pause Timer
                      </Button>
                      <Button
                        leftSection={<IconCheck size={16} />}
                        color="green"
                        onClick={handleCompleteTask}
                        flex={1}
                      >
                        Mark Complete
                      </Button>
                    </>
                  ) : null}
                </Group>
                
                {isTimerActive && !isActiveTask && (
                  <Text size="xs" c="dimmed" ta="center">
                    Another task is currently active. Pause it first to work on this task.
                  </Text>
                )}
              </Stack>
            </Paper>
          )}

          {/* Task History */}
          <Paper p="md" withBorder radius="md">
            <Stack spacing="md">
              <Title order={5} size="lg">📝 Task History</Title>
              
              {task.first_started_at && (
                <div>
                  <Group spacing="xs" align="center" mb="xs">
                    <IconPlayerPlay size={14} color="#868e96" />
                    <Text size="sm" c="dimmed" fw={500}>FIRST STARTED</Text>
                  </Group>
                  <Text size="md">{formatDate(task.first_started_at)}</Text>
                </div>
              )}
              
              {task.completed_at && (
                <>
                  <Divider />
                  <div>
                    <Group spacing="xs" align="center" mb="xs">
                      <IconCheck size={14} color="#40c057" />
                      <Text size="sm" c="dimmed" fw={500}>COMPLETED</Text>
                    </Group>
                    <Text size="md">{formatDate(task.completed_at)}</Text>
                  </div>
                  
                  {task.mental_state && (
                    <div>
                      <Group spacing="xs" align="center" mb="xs">
                        <Text size="sm" c="dimmed" fw={500}>MENTAL STATE</Text>
                      </Group>
                      <Text size="md">{formatMentalState(task.mental_state)}</Text>
                    </div>
                  )}
                  
                  {task.reflection && (
                    <div>
                      <Group spacing="xs" align="center" mb="xs">
                        <IconNotes size={14} color="#868e96" />
                        <Text size="sm" c="dimmed" fw={500}>REFLECTION</Text>
                      </Group>
                      <Paper p="sm" bg="gray.0" radius="sm">
                        <Text size="md" style={{ whiteSpace: 'pre-wrap' }}>
                          {task.reflection}
                        </Text>
                      </Paper>
                    </div>
                  )}
                </>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Modal>

      {/* Edit Task Modal */}
      <EditTaskModal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleEditSubmit}
        task={task}
      />

      {/* Complete Task Modal */}
      <CompleteTaskModal
        opened={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        onComplete={handleCompleteSubmit}
        task={task}
        timeWorked={task.total_time_worked || 0}
      />
    </>
  )
}

export default TaskDetailModal
