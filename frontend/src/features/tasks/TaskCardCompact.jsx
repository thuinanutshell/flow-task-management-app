import {
  ActionIcon,
  Badge,
  Button,
  ColorSwatch,
  Group,
  Menu,
  Paper,
  Stack,
  Text
} from '@mantine/core'
import {
  IconCheck,
  IconDots,
  IconEdit,
  IconEye,
  IconPlayerPause,
  IconPlayerPlay,
  IconTrash
} from '@tabler/icons-react'
import { useState } from 'react'
import { useTimer } from '../../context/TimerContext'
import { useTasks } from '../../hooks/useTasks'
import CompleteTaskModal from './CompleteTaskModal'
import EditTaskModal from './EditTaskModal'
import TaskDetailModal from './TaskDetailModal'
import TimerExpirationModal from './TimerExpirationModal'

const TaskCardCompact = ({
  task,
  onUpdate
}) => {
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const { updateTask, deleteTask, taskOptions } = useTasks()
  const {
    activeTask,
    isTimerActive,
    startTimer,
    pauseTimer,
    completeTask,
    continueTimer,
    hideExpirationModal,
    showExpirationModal,
    isExpired,
    getFormattedTimeRemaining
  } = useTimer()

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
    // Show different color for expired timers
    if (isThisTaskActive && isExpired) {
      return 'red' // Red for expired
    }
    
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
      // Show "Expired" when timer has expired
      if (isExpired) {
        return 'Timer Expired - Choose Action!'
      }
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

  const handleViewDetails = () => {
    setDetailModalOpen(true)
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

  // Handle continuing expired timer
  const handleContinueTimer = async (additionalMinutes) => {
    try {
      await continueTimer(additionalMinutes)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to continue timer:', error)
    }
  }

  // Handle marking expired task as done
  const handleMarkExpiredAsDone = () => {
    hideExpirationModal()
    setCompleteModalOpen(true)
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
        if (onUpdate) onUpdate()
      } catch (error) {
        console.error('Failed to delete task:', error)
      }
    }
  }

  const renderActionButton = () => {
    switch (task.status) {
      case 'not_started':
      case 'paused':
        return (
          <Button
            size="xs"
            variant="light"
            leftSection={<IconPlayerPlay size={12} />}
            onClick={handleStartTimer}
            disabled={isTimerActive && !isActiveTask}
          >
            {task.status === 'not_started' ? 'Start Now' : 'Resume'}
          </Button>
        )

      case 'active':
        // Different buttons for expired vs active timers
        if (isThisTaskActive && isExpired) {
          // Timer has expired - user should see the modal, but show status
        } else {
          // Timer is still running normally
          return (
            <Group spacing="xs">
              <Button
                size="xs"
                variant="outline"
                leftSection={<IconPlayerPause size={12} />}
                onClick={handlePauseTimer}
              >
                Pause
              </Button>
              <Button
                size="xs"
                color="green"
                leftSection={<IconCheck size={12} />}
                onClick={handleCompleteTask}
              >
                Done
              </Button>
            </Group>
          )
        }

      case 'done':
        return (
          <Badge color="green" variant="light" size="sm">
            <IconCheck size={10} style={{ marginRight: 4 }} />
            Completed
          </Badge>
        )

      default:
        return null
    }
  }

  const category = getTaskCategory()

  return (
    <>
      <Paper
        p="sm"
        radius="md"
        withBorder
        style={{
          backgroundColor: isThisTaskActive ? '#e3f2fd' : 'white',
          transition: 'all 0.2s ease',
          border: isThisTaskActive ? '2px solid #1976d2' : '1px solid #dee2e6'
        }}
      >
        <Stack spacing="xs">
          {/* Task Header */}
          <Group justify="space-between" align="flex-start">
            <div 
              style={{ flex: 1, cursor: 'pointer' }}
              onClick={handleViewDetails}
            >
              <Text fw={500} size="sm" lineClamp={1}>
                {task.name}
              </Text>
              {task.description && (
                <Text size="xs" c="dimmed" lineClamp={1} mt={2}>
                  {task.description}
                </Text>
              )}
              {category && (
                <Group spacing="xs" align="center" mt={4}>
                  <ColorSwatch
                    color={category.color}
                    size={12}
                  />
                  <Text size="xs" c="dimmed">
                    {category.name}
                  </Text>
                </Group>
              )}
            </div>

            <Group spacing="xs" align="center">
              <Badge
                color={getPriorityColor(task.priority)}
                size="xs"
                variant="filled"
              >
                {task.priority}
              </Badge>

              {/* Edit/Delete Menu - Only show if task is not active or expired */}
              {!isThisTaskActive && (
                <Menu shadow="md" width={120}>
                  <Menu.Target>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      aria-label="Task options"
                    >
                      <IconDots size={14} />
                    </ActionIcon>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconEye size={14} />}
                      onClick={handleViewDetails}
                    >
                      Details
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconEdit size={14} />}
                      onClick={handleEditTask}
                    >
                      Edit
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconTrash size={14} />}
                      color="red"
                      onClick={handleDeleteTask}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )}
            </Group>
          </Group>

          {/* Status and Action */}
          <Group justify="space-between" align="center">
            <Badge
              color={getStatusColor(task.status)}
              variant="light"
              size="xs"
            >
              {formatStatus(task.status)}
            </Badge>

            {task.status !== 'done' && (
              <div>
                {renderActionButton()}
              </div>
            )}
          </Group>
        </Stack>
      </Paper>

      {/* Timer Expiration Modal */}
      <TimerExpirationModal
        opened={showExpirationModal && isThisTaskActive}
        onClose={hideExpirationModal}
        onContinueTimer={handleContinueTimer}
        onMarkAsDone={handleMarkExpiredAsDone}
        task={task}
        timeWorked={task.total_time_worked || 0}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        opened={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        task={task}
        onUpdate={onUpdate}
      />

      {/* Complete Task Modal */}
      <CompleteTaskModal
        opened={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        onComplete={handleCompleteSubmit}
        task={task}
        timeWorked={task.total_time_worked || 0}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleEditSubmit}
        task={task}
      />
    </>
  )
}

export default TaskCardCompact