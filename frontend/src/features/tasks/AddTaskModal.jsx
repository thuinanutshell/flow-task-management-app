import {
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Select,
  Stack,
  TextInput,
  Textarea
} from '@mantine/core'
import { useForm } from '@mantine/form'
import {
  IconChecklist,
  IconClock,
  IconFlag,
  IconTag
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { taskService } from '../../services/tasks'

const AddTaskModal = ({ 
  opened, 
  onClose, 
  onSuccess,
  listId,
  listName
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [taskOptions, setTaskOptions] = useState(null)
  const [loadingOptions, setLoadingOptions] = useState(false)

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      priority: 'medium',
      plannedDuration: 25, // Default pomodoro time
      categoryId: ''
    },
    validate: {
      name: (value) => 
        value.trim().length > 0 ? null : 'Task name is required',
      priority: (value) =>
        value ? null : 'Please select a priority',
      plannedDuration: (value) =>
        value && value > 0 ? null : 'Planned duration must be greater than 0'
    }
  })

  // Load task options when modal opens
  useEffect(() => {
    if (opened) {
      loadTaskOptions()
    }
  }, [opened])

  const loadTaskOptions = async () => {
    try {
      setLoadingOptions(true)
      const response = await taskService.getTaskCreateOptions()
      setTaskOptions(response.data)
    } catch (error) {
      console.error('Failed to load task options:', error)
      setTaskOptions({ categories: [], priorities: ['high', 'medium', 'low'] })
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true)
      
      // Call the onSuccess callback with the form data
      if (onSuccess) {
        await onSuccess({
          name: values.name.trim(),
          description: values.description.trim(),
          listId: listId,
          priority: values.priority,
          plannedDuration: values.plannedDuration,
          categoryId: values.categoryId || null
        })
      }
      
      // Reset form and close modal on success
      form.reset()
      onClose()
    } catch (error) {
      // Error handling is done in the parent component (useTasks hook)
      console.error('Create task error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  // Prepare options for selects
  const priorityOptions = taskOptions?.priorities?.map(priority => ({
    value: priority,
    label: priority.charAt(0).toUpperCase() + priority.slice(1)
  })) || [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ]

  const categoryOptions = [
    { value: '', label: 'No Category' },
    ...(taskOptions?.categories?.map(category => ({
      value: category.id.toString(),
      label: category.name
    })) || [])
  ]

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Add New Task`}
      size="md"
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="md">
          <TextInput
            label="Task Name"
            placeholder="Enter task name"
            required
            leftSection={<IconChecklist size={16} />}
            {...form.getInputProps('name')}
            disabled={submitting}
          />

          <Textarea
            label="Description"
            placeholder="Enter task description (optional)"
            minRows={3}
            {...form.getInputProps('description')}
            disabled={submitting}
          />

          <div>
            <Select
              label="Priority"
              placeholder={loadingOptions ? "Loading priorities..." : "Select priority"}
              data={priorityOptions}
              required
              leftSection={
                loadingOptions ? (
                  <Loader size={16} />
                ) : (
                  <IconFlag size={16} />
                )
              }
              {...form.getInputProps('priority')}
              disabled={submitting || loadingOptions}
            />
          </div>

          <NumberInput
            label="Planned Duration (minutes)"
            placeholder="Enter planned duration"
            required
            min={1}
            max={480} // 8 hours max
            leftSection={<IconClock size={16} />}
            {...form.getInputProps('plannedDuration')}
            disabled={submitting}
          />

          <div>
            <Select
              label="Category"
              placeholder={loadingOptions ? "Loading categories..." : "Select category (optional)"}
              data={categoryOptions}
              searchable
              leftSection={
                loadingOptions ? (
                  <Loader size={16} />
                ) : (
                  <IconTag size={16} />
                )
              }
              {...form.getInputProps('categoryId')}
              disabled={submitting || loadingOptions}
            />
          </div>

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
            >
              Add Task
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default AddTaskModal