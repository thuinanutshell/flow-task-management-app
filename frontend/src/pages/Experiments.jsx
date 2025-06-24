import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  ActionIcon,
  Menu
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconFlask, IconPlus, IconTrendingUp, IconEdit, IconTrash, IconDots } from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import { useCategories } from '../hooks/useCategories'
import { useExperiments } from '../hooks/useExperiments'

const CreateExperimentModal = ({ opened, onClose, onSuccess, categories }) => {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({
    initialValues: {
      name: '',
      categoryId: '',
      experimentType: 'time_estimation',
      durationDays: 14
    },
    validate: {
      name: (value) => value.length > 0 ? null : 'Experiment name is required',
      categoryId: (value) => value ? null : 'Please select a category'
    }
  })

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true)
      await onSuccess(values)
      form.reset()
      onClose()
    } catch (error) {
      console.error('Create experiment error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const categoryOptions = categories.map(cat => ({
    value: cat.id.toString(),
    label: cat.name
  }))

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create New Experiment"
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="md">
          <TextInput
            label="Experiment Name"
            placeholder="e.g., Improve coding time estimates"
            required
            {...form.getInputProps('name')}
            disabled={submitting}
          />

          <Select
            label="Target Category"
            placeholder="Select category to experiment with"
            data={categoryOptions}
            required
            {...form.getInputProps('categoryId')}
            disabled={submitting}
          />

          <Select
            label="Experiment Type"
            data={[
              { value: 'time_estimation', label: 'Time Estimation Improvement' }
            ]}
            {...form.getInputProps('experimentType')}
            disabled={submitting}
            description="More experiment types coming soon!"
          />

          <Select
            label="Duration"
            data={[
              { value: '7', label: '1 week' },
              { value: '14', label: '2 weeks' },
              { value: '30', label: '1 month' }
            ]}
            {...form.getInputProps('durationDays')}
            disabled={submitting}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Experiment
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

const EditExperimentModal = ({ opened, onClose, onSuccess, experiment, categories }) => {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({
    initialValues: {
      name: experiment?.name || '',
      categoryId: experiment?.target_category_id?.toString() || '',
      experimentType: 'time_estimation',
      durationDays: 14
    },
    validate: {
      name: (value) => value.length > 0 ? null : 'Experiment name is required',
      categoryId: (value) => value ? null : 'Please select a category'
    }
  })

  useEffect(() => {
    if (experiment) {
      form.setValues({
        name: experiment.name || '',
        categoryId: experiment.target_category_id?.toString() || '',
        experimentType: 'time_estimation',
        durationDays: 14
      })
    }
  }, [experiment])

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true)
      await onSuccess(experiment.id, {
        name: values.name.trim()
      })
      onClose()
    } catch (error) {
      console.error('Update experiment error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const categoryOptions = categories.map(cat => ({
    value: cat.id.toString(),
    label: cat.name
  }))

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Edit Experiment"
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="md">
          <TextInput
            label="Experiment Name"
            placeholder="e.g., Improve coding time estimates"
            required
            {...form.getInputProps('name')}
            disabled={submitting}
          />

          <Select
            label="Target Category"
            placeholder="Select category to experiment with"
            data={categoryOptions}
            required
            {...form.getInputProps('categoryId')}
            disabled={true} // Can't change category for existing experiment
            description="Category cannot be changed for existing experiments"
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Update Experiment
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

const ExperimentCard = ({ experiment, onViewResults, onEdit, onDelete }) => {
  const [results, setResults] = useState(null)
  const [loadingResults, setLoadingResults] = useState(false)

  const handleViewResults = async () => {
    try {
      setLoadingResults(true)
      const data = await onViewResults(experiment.id)
      setResults(data)
    } catch (error) {
      console.error('Failed to load results:', error)
    } finally {
      setLoadingResults(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'blue'
      case 'completed': return 'green'
      case 'pending': return 'orange'
      default: return 'gray'
    }
  }

  return (
    <Card withBorder p="md" h="100%">
      <Stack spacing="md" h="100%" justify="space-between">
        <div>
          <Group justify="space-between" align="flex-start" mb="sm">
            <Text fw={500} size="md" lineClamp={2}>
              {experiment.name}
            </Text>
            <Group spacing="xs">
              <Badge color={getStatusColor(experiment.status)} size="sm">
                {experiment.status}
              </Badge>
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <ActionIcon variant="subtle" size="sm">
                    <IconDots size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {onEdit && experiment.status !== 'completed' && (
                    <Menu.Item 
                      leftSection={<IconEdit size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(experiment);
                      }}
                    >
                      Edit Experiment
                    </Menu.Item>
                  )}
                  {onDelete && (
                    <Menu.Item 
                      leftSection={<IconTrash size={14} />}
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(experiment);
                      }}
                    >
                      Delete Experiment
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>

          <Stack spacing="xs">
            <Group spacing="xs">
              <IconFlask size={14} color="#868e96" />
              <Text size="sm" c="dimmed">
                {experiment.intervention_category?.replace('_', ' ') || 'time estimation'}
              </Text>
            </Group>
            
            <Group spacing="xs">
              <Text size="sm" c="dimmed">
                Target: <strong>{experiment.target_category}</strong>
              </Text>
            </Group>

            <Text size="xs" c="dimmed">
              {new Date(experiment.start_date).toLocaleDateString()} - {new Date(experiment.end_date).toLocaleDateString()}
            </Text>
          </Stack>
        </div>

        {results && (
          <Box>
            <Text size="sm" fw={500} mb="xs">Results:</Text>
            <Stack spacing="xs">
              <Group justify="space-between">
                <Text size="xs">Tasks analyzed:</Text>
                <Text size="xs" fw={500}>{results.total_tasks || 0}</Text>
              </Group>
              
              {results.improvement !== undefined && (
                <Group justify="space-between">
                  <Text size="xs">Improvement:</Text>
                  <Text size="xs" fw={500} c={results.improvement > 0 ? 'green' : 'red'}>
                    {results.improvement > 0 ? '+' : ''}{results.improvement}%
                  </Text>
                </Group>
              )}
              
              {results.control_group && results.experiment_group && (
                <>
                  <Group justify="space-between">
                    <Text size="xs">Control group accuracy:</Text>
                    <Text size="xs" fw={500}>{results.control_group.avg_accuracy || 0}%</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs">Experiment group accuracy:</Text>
                    <Text size="xs" fw={500}>{results.experiment_group.avg_accuracy || 0}%</Text>
                  </Group>
                </>
              )}
              
              {results.success !== undefined && (
                <Badge 
                  fullWidth 
                  mt="xs" 
                  color={results.success ? 'green' : 'red'}
                  variant="light"
                >
                  {results.success ? 'Successful experiment' : 'Needs improvement'}
                </Badge>
              )}
            </Stack>
          </Box>
        )}

        <Button
          variant="light"
          size="sm"
          onClick={handleViewResults}
          loading={loadingResults}
          leftSection={<IconTrendingUp size={14} />}
        >
          {results ? 'Refresh Results' : 'View Results'}
        </Button>
      </Stack>
    </Card>
  )
}

const Experiments = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedExperiment, setSelectedExperiment] = useState(null)
  const { 
    experiments, 
    loading, 
    useMockData, 
    createExperiment, 
    getExperimentResults,
    updateExperiment,
    deleteExperiment 
  } = useExperiments()
  const { categories } = useCategories()

  const handleCreateExperiment = async (experimentData) => {
    await createExperiment({
      name: experimentData.name,
      categoryId: parseInt(experimentData.categoryId),
      experimentType: experimentData.experimentType,
      durationDays: parseInt(experimentData.durationDays)
    })
  }

  const handleEditExperiment = (experiment) => {
    setSelectedExperiment(experiment)
    setEditModalOpen(true)
  }

  const handleEditExperimentSubmit = async (experimentId, updateData) => {
    await updateExperiment(experimentId, updateData)
    setSelectedExperiment(null)
  }

  const handleDeleteExperiment = async (experiment) => {
    if (window.confirm(`Are you sure you want to delete "${experiment.name}"?`)) {
      await deleteExperiment(experiment.id)
    }
  }

  if (loading) {
    return (
      <Container size="xl">
        <Stack align="center" justify="center" h={400}>
          <Text>Loading experiments...</Text>
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack spacing="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1}>Experiments</Title>
            <Text c="dimmed" size="lg" mt="xs">
              Test different productivity techniques and improve your workflow
            </Text>
          </div>
          
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateModalOpen(true)}
          >
            New Experiment
          </Button>
        </Group>

        {/* Info Card */}
        <Alert color="blue" variant="light">
          <Text size="sm">
            <strong>How it works:</strong> Create experiments to test productivity techniques. 
            For example, try "Time Estimation" experiments to improve how accurately you estimate task duration.
            The system will randomly suggest different time estimates and track which approach works better.
          </Text>
        </Alert>

        {/* Mock Data Notice */}
        {useMockData && (
          <Text ta="center" c="dimmed" size="sm" mt="xs" mb="xs">
            Using sample data for demonstration
          </Text>
        )}

        {/* Experiments Grid */}
        {experiments.length === 0 ? (
          <Box
            p="xl"
            style={{
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '2px dashed #dee2e6',
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Stack align="center" spacing="md">
              <IconFlask size={48} color="#adb5bd" />
              <div>
                <Title order={3} c="dimmed">No experiments yet</Title>
                <Text c="dimmed" mt="xs" size="sm">
                  Create your first experiment to start improving your productivity
                </Text>
              </div>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setCreateModalOpen(true)}
                mt="md"
              >
                Create Your First Experiment
              </Button>
            </Stack>
          </Box>
        ) : (
          <Grid>
            {experiments.map((experiment) => (
              <Grid.Col key={experiment.id} span={{ base: 12, sm: 6, md: 4 }}>
                <ExperimentCard
                  experiment={experiment}
                  onViewResults={getExperimentResults}
                  onEdit={handleEditExperiment}
                  onDelete={handleDeleteExperiment}
                />
              </Grid.Col>
            ))}
          </Grid>
        )}

        {/* Create Experiment Modal */}
        <CreateExperimentModal
          opened={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleCreateExperiment}
          categories={categories}
        />

        {/* Edit Experiment Modal */}
        <EditExperimentModal
          opened={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setSelectedExperiment(null)
          }}
          onSuccess={handleEditExperimentSubmit}
          experiment={selectedExperiment}
          categories={categories}
        />
      </Stack>
    </Container>
  )
}

export default Experiments
