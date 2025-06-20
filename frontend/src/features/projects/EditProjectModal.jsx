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
import { useEffect, useState } from 'react'

const EditProjectModal = ({ 
  opened, 
  onClose, 
  onSuccess,
  project
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

  // Update form when project changes
  useEffect(() => {
    if (project) {
      form.setValues({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'not_started'
      })
    }
  }, [project])

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
        await onSuccess(project.id, {
          name: values.name.trim(),
          description: values.description.trim(),
          status: values.status
        })
      }
      
      // Close modal on success
      onClose()
    } catch (error) {
      // Error handling is done in the parent component (useProjects hook)
      console.error('Update project error:', error)
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
      title="Edit Project"
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
            leftSection={<IconFileText size={16} />}
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
              Update Project
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default EditProjectModal