// features/tasks/TaskCardCompact.jsx
import {
    Badge,
    Button,
    Group,
    Paper,
    Stack,
    Text
} from '@mantine/core'
import {
    IconCheck,
    IconPlayerPause,
    IconPlayerPlay
} from '@tabler/icons-react'
import { useState } from 'react'
import { useTimer } from '../../context/TimerContext'
import CompleteTaskModal from './CompleteTaskModal'

const TaskCardCompact = ({ 
  task,
  onUpdate
}) => {
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const { 
    activeTask, 
    isTimerActive, 
    startTimer, 
    pauseTimer, 
    completeTask,
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
      if (onUpdate) onUpdate()
      setCompleteModalOpen(false)
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const renderActionButton = () => {
    // If another task is active, disable actions for this task
    if (isTimerActive && !isActiveTask) {
      return (
        <Badge color="gray" variant="light" size="xs">
          Locked
        </Badge>
      )
    }

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

  return (
    <>
      <Paper 
        p="sm" 
        radius="md" 
        withBorder
        style={{ 
          backgroundColor: isThisTaskActive ? '#e3f2fd' : 'white',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          border: isThisTaskActive ? '2px solid #1976d2' : '1px solid #dee2e6'
        }}
      >
        <Stack spacing="xs">
          {/* Task Header */}
          <Group justify="space-between" align="flex-start">
            <div style={{ flex: 1 }}>
              <Text fw={500} size="sm" lineClamp={1}>
                {task.name}
              </Text>
              {task.description && (
                <Text size="xs" c="dimmed" lineClamp={1} mt={2}>
                  {task.description}
                </Text>
              )}
            </div>
            
            <Badge 
              color={getPriorityColor(task.priority)} 
              size="xs"
              variant="filled"
            >
              {task.priority}
            </Badge>
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

export default TaskCardCompact