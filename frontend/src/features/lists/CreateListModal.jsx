import {
    Alert,
    Button,
    Group,
    Loader,
    Modal,
    Select,
    Stack,
    TextInput
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle, IconFolder, IconList } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { projectService } from '../../services/projects'

const CreateListModal = ({ 
  opened, 
  onClose, 
  onSuccess 
}) => {
  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({
    initialValues: {
      name: '',
      projectId: ''
    },
    validate: {
      name: (value) => 
        value.trim().length > 0 ? null : 'List name is required',
      projectId: (value) =>
        value ? null : 'Please select a project'
    }
  })

  // Load projects when modal opens
  useEffect(() => {
    if (opened) {
      loadProjects()
    }
  }, [opened])

  const loadProjects = async () => {
    try {
      setLoadingProjects(true)
      const response = await projectService.getAll()
      setProjects(response.data || [])
    } catch (error) {
      console.error('Failed to load projects:', error)
      setProjects([])
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true)
      
      // Call the onSuccess callback with the form data
      if (onSuccess) {
        await onSuccess({
          name: values.name.trim(),
          projectId: parseInt(values.projectId)
        })
      }
      
      // Reset form and close modal on success
      form.reset()
      onClose()
    } catch (error) {
      // Error handling is done in the parent component (useLists hook)
      console.error('Create list error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  // Prepare project options for the select
  const projectOptions = projects.map(project => ({
    value: project.id.toString(),
    label: `${project.name} (${project.status})`
  }))

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Create New List"
      size="md"
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="md">
          <TextInput
            label="List Name"
            placeholder="Enter list name"
            required
            leftSection={<IconList size={16} />}
            {...form.getInputProps('name')}
            disabled={submitting}
          />

          <div>
            <Select
              label="Project"
              placeholder={loadingProjects ? "Loading projects..." : "Select a project"}
              data={projectOptions}
              searchable
              required
              leftSection={
                loadingProjects ? (
                  <Loader size={16} />
                ) : (
                  <IconFolder size={16} />
                )
              }
              {...form.getInputProps('projectId')}
              disabled={submitting || loadingProjects}
            />
            
            {projects.length === 0 && !loadingProjects && (
              <Alert 
                icon={<IconAlertCircle size="1rem" />} 
                title="No Projects Found" 
                color="orange"
                mt="xs"
              >
                You need to create a project first before creating lists.
              </Alert>
            )}
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
              disabled={projects.length === 0}
            >
              Create List
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default CreateListModal