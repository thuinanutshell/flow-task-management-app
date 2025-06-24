import {
    Button,
    Group,
    Modal,
    NumberInput,
    Stack,
    Text,
    Title
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconClock, IconPlayerPlay } from '@tabler/icons-react'
import { useState } from 'react'

const TimerExpirationModal = ({
  opened,
  onClose,
  onContinueTimer,
  onMarkAsDone,
  task,
  timeWorked
}) => {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({
    initialValues: {
      additionalMinutes: 15 // Default 15 more minutes
    },
    validate: {
      additionalMinutes: (value) =>
        value && value > 0 ? null : 'Please enter additional minutes'
    }
  })

  const handleContinueTimer = async (values) => {
    try {
      setSubmitting(true)
      if (onContinueTimer) {
        await onContinueTimer(values.additionalMinutes)
      }
      onClose()
    } catch (error) {
      console.error('Continue timer error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkAsDone = () => {
    if (onMarkAsDone) {
      onMarkAsDone()
    }
    onClose()
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
      onClose={onClose}
      title={
        <Group spacing="sm">
          <IconClock size={24} color="#fa5252" />
          <Title order={3}>Timer Completed!</Title>
        </Group>
      }
      size="md"
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      <Stack spacing="lg">
        {/* Task Summary */}
        <div>
          <Text size="lg" fw={500} mb="xs">
            Time's up for "{task?.name}"
          </Text>
          <Text size="md" c="dimmed">
            You worked for {formatTimeWorked(timeWorked)} 
            {task?.planned_duration && ` (planned: ${task.planned_duration}m)`}
          </Text>
        </div>

        {/* Options */}
        <Stack spacing="md">
          <Text fw={500} size="md">What would you like to do?</Text>
          
          {/* Continue Timer Option */}
          <form onSubmit={form.onSubmit(handleContinueTimer)}>
            <Stack spacing="sm">
              <NumberInput
                label="Continue working for additional minutes"
                placeholder="Enter minutes"
                min={1}
                max={240} // Max 4 hours
                leftSection={<IconClock size={16} />}
                {...form.getInputProps('additionalMinutes')}
                disabled={submitting}
              />
              
              <Button
                type="submit"
                leftSection={<IconPlayerPlay size={16} />}
                loading={submitting}
                variant="outline"
                fullWidth
              >
                Continue Timer
              </Button>
            </Stack>
          </form>

          {/* Mark as Done Option */}
          <Button
            onClick={handleMarkAsDone}
            color="green"
            fullWidth
            disabled={submitting}
          >
            Mark Task as Done
          </Button>
        </Stack>

        {/* Helper Text */}
        <Text size="xs" c="dimmed" ta="center">
          Choose "Continue Timer" to keep working, or "Mark as Done" to complete the task with reflection.
        </Text>
      </Stack>
    </Modal>
  )
}

export default TimerExpirationModal