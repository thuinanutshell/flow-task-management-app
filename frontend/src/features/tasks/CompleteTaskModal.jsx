import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
  Title
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconBrain } from '@tabler/icons-react'
import { useState } from 'react'

const CompleteTaskModal = ({ 
  opened, 
  onClose, 
  onComplete,
  task,
  timeWorked
}) => {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({
    initialValues: {
      mentalState: '',
      reflection: ''
    },
    validate: {
      mentalState: (value) => 
        value ? null : 'Please select your mental state',
      reflection: (value) => 
        value && value.trim().length > 0 ? null : 'Please add your reflection'
    }
  })

  // Mental state options from backend enum
  const mentalStateOptions = [
    { value: 'energized', label: '⚡ Energized' },
    { value: 'focused', label: '🎯 Focused' },
    { value: 'satisfied', label: '😊 Satisfied' },
    { value: 'motivated', label: '🚀 Motivated' },
    { value: 'tired', label: '😴 Tired' },
    { value: 'frustrated', label: '😤 Frustrated' },
    { value: 'anxious', label: '😰 Anxious' }
  ]

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true)
      
      if (onComplete) {
        await onComplete(values.mentalState, values.reflection.trim())
      }
      
      form.reset()
      onClose()
    } catch (error) {
      console.error('Complete task error:', error)
      // Error handling is done in the parent component
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      form.reset()
      onClose()
    }
  }

  // Format time worked for display
  const formatTimeWorked = (minutes) => {
    if (minutes < 60) {
      return `${minutes} minutes`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group spacing="sm">
          <IconBrain size={24} color="#228be6" />
          <Title order={3}>Complete Task</Title>
        </Group>
      }
      size="md"
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
      centered
    >
      <Stack spacing="lg">
        {/* Task Summary */}
        <div>
          <Text size="lg" fw={500} mb="xs">
            "{task?.name}"
          </Text>
          <Group spacing="md">
            <Text size="sm" c="dimmed">
              Time worked: {formatTimeWorked(timeWorked)}
            </Text>
            <Text size="sm" c="dimmed">
              Planned: {task?.planned_duration}m
            </Text>
          </Group>
        </div>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack spacing="md">
            {/* Mental State Selection */}
            <Select
              label="How are you feeling after completing this task?"
              placeholder="Select your mental state"
              data={mentalStateOptions}
              required
              {...form.getInputProps('mentalState')}
              disabled={submitting}
            />

            {/* Reflection */}
            <Textarea
              label="Reflection"
              placeholder="What went well? What was challenging? Any insights or learnings?"
              required
              minRows={4}
              maxRows={8}
              {...form.getInputProps('reflection')}
              disabled={submitting}
            />

            {/* Action Buttons */}
            <Group justify="flex-end" mt="md">
              <Button 
                variant="outline" 
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                loading={submitting}
                color="green"
              >
                Complete Task
              </Button>
            </Group>
          </Stack>
        </form>

        {/* Helper Text */}
        <Text size="xs" c="dimmed" ta="center">
          Your reflection helps track your productivity patterns and improve future task planning.
        </Text>
      </Stack>
    </Modal>
  )
}

export default CompleteTaskModal