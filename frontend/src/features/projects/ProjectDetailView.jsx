import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Grid,
    Group,
    Loader,
    Progress,
    Stack,
    Text,
    Title
} from '@mantine/core'
import {
    IconArrowLeft,
    IconClock,
    IconEdit,
    IconList,
    IconPlus,
    IconTrash
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLists } from '../../hooks/useLists'
import { useProjects } from '../../hooks/useProjects'
import CreateListModal from '../lists/CreateListModal'

const ProjectDetailView = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [createListModalOpen, setCreateListModalOpen] = useState(false)
  
  const { getProjectDetail } = useProjects()
  const { createList } = useLists()

  const loadProjectDetail = async () => {
    try {
      setLoading(true)
      const projectData = await getProjectDetail(parseInt(projectId))
      setProject(projectData)
    } catch (error) {
      console.error('Failed to load project:', error)
      navigate('/projects') // Redirect if project not found
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjectDetail()
  }, [projectId])

  const handleCreateList = async (listData) => {
    const updatedListData = {
      ...listData,
      projectId: parseInt(projectId)
    }
    await createList(updatedListData)
    // Refresh project data to show new list
    await loadProjectDetail()
  }

  const handleEditProject = () => {
    // TODO: Open edit modal or navigate to edit page
    console.log('Edit project:', project.id)
  }

  const handleDeleteProject = () => {
    // TODO: Confirm and delete project
    console.log('Delete project:', project.id)
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'not_started': return 'gray'
      case 'in_progress': return 'blue'
      case 'pending': return 'orange'
      case 'done': return 'green'
      default: return 'gray'
    }
  }

  // Format status text
  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // Calculate overall project progress
  const calculateProgress = () => {
    if (!project?.lists || project.lists.length === 0) return 0
    
    const totalTasks = project.lists.reduce((sum, list) => sum + (list.task_count || 0), 0)
    const completedTasks = project.lists.reduce((sum, list) => sum + (list.completed_tasks || 0), 0)
    
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  }

  if (loading) {
    return (
      <Box p="xl" style={{ textAlign: 'center' }}>
        <Loader size="lg" />
        <Text mt="md">Loading project details...</Text>
      </Box>
    )
  }

  if (!project) {
    return (
      <Box p="xl" style={{ textAlign: 'center' }}>
        <Text>Project not found</Text>
        <Button mt="md" onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </Box>
    )
  }

  const progressPercentage = calculateProgress()

  return (
    <Box p="xl">
      <Stack spacing="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Group spacing="md">
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={() => navigate('/projects')}
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <div>
              <Group spacing="md" align="center">
                <Title order={1}>{project.name}</Title>
                <Badge 
                  color={getStatusColor(project.status)} 
                  variant="light"
                  size="lg"
                >
                  {formatStatus(project.status)}
                </Badge>
              </Group>
              {project.description && (
                <Text c="dimmed" mt="xs">
                  {project.description}
                </Text>
              )}
            </div>
          </Group>

          <Group spacing="sm">
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={handleEditProject}
            >
              <IconEdit size={20} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="lg"
              color="red"
              onClick={handleDeleteProject}
            >
              <IconTrash size={20} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Project Stats */}
        <Grid>
          <Grid.Col span={3}>
            <Card withBorder h="100%">
              <Group spacing="sm">
                <IconList size={24} color="#228be6" />
                <div>
                  <Text size="xl" fw={700}>{project.lists?.length || 0}</Text>
                  <Text size="sm" c="dimmed">Lists</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={3}>
            <Card withBorder h="100%">
              <Group spacing="sm">
                <IconClock size={24} color="#40c057" />
                <div>
                  <Text size="xl" fw={700}>
                    {project.lists?.reduce((sum, list) => sum + (list.task_count || 0), 0) || 0}
                  </Text>
                  <Text size="sm" c="dimmed">Total Tasks</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={3}>
            <Card withBorder h="100%">
              <Group spacing="sm">
                <IconClock size={24} color="#fab005" />
                <div>
                  <Text size="xl" fw={700}>
                    {project.lists?.reduce((sum, list) => sum + (list.completed_tasks || 0), 0) || 0}
                  </Text>
                  <Text size="sm" c="dimmed">Completed</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={3}>
            <Card withBorder h="100%">
              <div>
                <Text size="xl" fw={700}>{Math.round(progressPercentage)}%</Text>
                <Text size="sm" c="dimmed" mb="xs">Progress</Text>
              </div>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Lists Section */}
        <Group justify="space-between" align="center">
          <Title order={2}>Lists</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateListModalOpen(true)}
          >
            Add List
          </Button>
        </Group>

        {/* Lists Grid */}
        {project.lists && project.lists.length > 0 ? (
          <Grid>
            {project.lists.map((list) => (
              <Grid.Col key={list.id} span={{ base: 12, sm: 6, md: 4 }}>
                <Card
                  withBorder
                  p="lg"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/dashboard')}
                >
                  <Stack spacing="sm">
                    <Text fw={500} size="md">{list.name}</Text>
                    
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        {list.completed_tasks || 0} / {list.task_count || 0} tasks
                      </Text>
                      <Text size="sm" c="dimmed">
                        {Math.round((list.progress || 0) * 100)}%
                      </Text>
                    </Group>
                    
                    <Progress 
                      value={(list.progress || 0) * 100} 
                      color="blue" 
                      size="sm" 
                    />
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        ) : (
          <Card withBorder p="xl" style={{ textAlign: 'center' }}>
            <Stack align="center" spacing="md">
              <IconList size={48} color="#adb5bd" />
              <div>
                <Text fw={500} c="dimmed">No lists yet</Text>
                <Text size="sm" c="dimmed" mt="xs">
                  Create your first list to start organizing tasks
                </Text>
              </div>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setCreateListModalOpen(true)}
              >
                Create First List
              </Button>
            </Stack>
          </Card>
        )}

        {/* Create List Modal */}
        <CreateListModal
          opened={createListModalOpen}
          onClose={() => setCreateListModalOpen(false)}
          onSuccess={handleCreateList}
        />
      </Stack>
    </Box>
  )
}

export default ProjectDetailView
