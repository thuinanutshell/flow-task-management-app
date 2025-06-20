import {
    Button,
    Group,
    Modal,
    Select,
    Stack,
    TextInput,
    Textarea
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconFileText, IconFlag, IconFolder } from '@tabler/icons-react'
import { useState } from 'react'

const CreateProjectModal = ({ 
  opened, 
  onClose, 
  onSuccess 
}) => {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      status: 'not_started'
    },
    validate: {
      name: (value) => 
        value.trim().length > 0 ? null : 'Project name is required',
      status: (value) =>
        value ? null : 'Please select a status'
    }
  })

  // Status options based on your backend validation
  const statusOptions = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'pending', label: 'Pending' },
    { value: 'done', label: 'Done' }
  ]

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true)
      
      // Call the onSuccess callback with the form data
      if (onSuccess) {
        await onSuccess({
          name: values.name.trim(),
          description: values.description.trim(),
          status: values.status
        })
      }
      
      // Reset form and close modal on success
      form.reset()
      onClose()
    } catch (error) {
      // Error handling is done in the parent component (useProjects hook)
      console.error('Create project error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Create New Project"
      size="md"
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="md">
          <TextInput
            label="Project Name"
            placeholder="Enter project name"
            required
            leftSection={<IconFolder size={16} />}
            {...form.getInputProps('name')}
            disabled={submitting}
          />

          <Textarea
            label="Description"
            placeholder="Enter project description (optional)"
            minRows={3}
            {...form.getInputProps('description')}
            disabled={submitting}
          />

          <Select
            label="Status"
            placeholder="Select project status"
            data={statusOptions}
            required
            leftSection={<IconFlag size={16} />}
            {...form.getInputProps('status')}
            disabled={submitting}
          />

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
              Create Project
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default CreateProjectModal