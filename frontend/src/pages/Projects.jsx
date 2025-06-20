import {
    Alert,
    Box,
    Button,
    Container,
    Grid,
    Group,
    Loader,
    Stack,
    Text,
    Title
} from '@mantine/core'
import { IconAlertCircle, IconFolder, IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import CreateProjectModal from '../features/projects/CreateProjectModal'
import ProjectCard from '../features/projects/ProjectCard'
import { useProjects } from '../hooks/useProjects'

const Projects = () => {
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false)
  
  // Use the projects hook
  const { 
    projects, 
    loading, 
    error, 
    createProject, 
    updateProject, 
    deleteProject 
  } = useProjects()

  const handleCreateProject = () => {
    setCreateProjectModalOpen(true)
  }

  const handleCreateProjectSubmit = async (projectData) => {
    await createProject(projectData)
  }

  const handleEditProject = (project) => {
    // TODO: Open edit modal
    console.log('Edit project:', project)
  }

  const handleDeleteProject = async (project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This will also delete all lists and tasks in this project.`)) {
      await deleteProject(project.id)
    }
  }

  const handleViewProject = (project) => {
    // TODO: Navigate to project detail page
    console.log('View project:', project)
  }

  if (loading) {
    return (
      <Container size="xl">
        <Stack align="center" justify="center" h={400}>
          <Loader size="lg" />
          <Text>Loading your projects...</Text>
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
            <Title order={1}>Projects</Title>
            <Text c="dimmed" size="lg" mt="xs">
              Organize your tasks into projects
            </Text>
          </div>
          
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreateProject}
          >
            Create Project
          </Button>
        </Group>

        {/* Error Display */}
        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {/* Main Content */}
        <Box>
          {projects.length === 0 ? (
            // Empty State
            <Box
              p="xl"
              style={{
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                border: '2px dashed #dee2e6',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Stack align="center" spacing="md">
                <IconFolder size={48} color="#adb5bd" />
                <div>
                  <Title order={3} c="dimmed">No projects yet</Title>
                  <Text c="dimmed" mt="xs" size="sm">
                    Create your first project to start organizing your tasks
                  </Text>
                </div>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={handleCreateProject}
                  mt="md"
                >
                  Create Your First Project
                </Button>
              </Stack>
            </Box>
          ) : (
            // Projects Grid
            <Grid>
              {projects.map((project) => (
                <Grid.Col key={project.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                  <ProjectCard
                    project={project}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                    onView={handleViewProject}
                  />
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Box>

        {/* Create Project Modal */}
        <CreateProjectModal
          opened={createProjectModalOpen}
          onClose={() => setCreateProjectModalOpen(false)}
          onSuccess={handleCreateProjectSubmit}
        />
      </Stack>
    </Container>
  )
}

export default Projects