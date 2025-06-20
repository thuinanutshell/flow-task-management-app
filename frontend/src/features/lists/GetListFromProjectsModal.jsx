import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core'
import {
  IconAlertCircle,
  IconCheck,
  IconFolder,
  IconList,
  IconSearch
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { projectService } from '../../services/projects'

const GetListFromProjectsModal = ({ 
  opened, 
  onClose, 
  onSuccess 
}) => {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null)
  const [selectedLists, setSelectedLists] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingProjectDetail, setLoadingProjectDetail] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load projects when modal opens
  useEffect(() => {
    if (opened) {
      loadProjects()
      // Reset state
      setSelectedProject(null)
      setSelectedProjectDetails(null)
      setSelectedLists([])
      setSearchFilter('')
      setStatusFilter('')
    }
  }, [opened])

  // Load project details when a project is selected
  useEffect(() => {
    if (selectedProject) {
      loadProjectDetail(selectedProject.id)
    }
  }, [selectedProject])

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

  const loadProjectDetail = async (projectId) => {
    try {
      setLoadingProjectDetail(true)
      const response = await projectService.getProjectById(projectId)
      setSelectedProjectDetails(response.data)
    } catch (error) {
      console.error('Failed to load project details:', error)
      setSelectedProjectDetails(null)
    } finally {
      setLoadingProjectDetail(false)
    }
  }

  const handleProjectSelect = (project) => {
    setSelectedProject(project)
    setSelectedProjectDetails(null) // Reset project details when changing project
    setSelectedLists([]) // Reset selected lists when changing project
  }

  const handleListToggle = (list) => {
    setSelectedLists(prev => {
      const isSelected = prev.some(l => l.id === list.id)
      if (isSelected) {
        return prev.filter(l => l.id !== list.id)
      } else {
        // Add project info to the list when selecting
        const listWithProjectInfo = {
          ...list,
          project_id: selectedProject.id,
          project_name: selectedProject.name,
          project_status: selectedProject.status,
          project: selectedProject // Include full project object
        }
        return [...prev, listWithProjectInfo]
      }
    })
  }

  const handleImportToWorkspace = async () => {
    try {
      setSubmitting(true)
      
      if (onSuccess && selectedLists.length > 0) {
        // Pass the selected lists with project info to parent
        await onSuccess(selectedLists)
      }
      
      handleClose()
    } catch (error) {
      console.error('Import to workspace error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedProject(null)
    setSelectedProjectDetails(null)
    setSelectedLists([])
    setSearchFilter('')
    setStatusFilter('')
    onClose()
  }

  // Filter projects based on search and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchFilter || 
      project.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchFilter.toLowerCase())
    
    const matchesStatus = !statusFilter || project.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

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

  // Status options for filtering
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'pending', label: 'Pending' },
    { value: 'done', label: 'Done' }
  ]

  // Check if a list is selected
  const isListSelected = (list) => {
    return selectedLists.some(l => l.id === list.id)
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Import Lists from Projects"
      size="xl"
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      <Stack spacing="md">

        {/* Filters */}
        <Group spacing="md">
          <TextInput
            placeholder="Search projects..."
            leftSection={<IconSearch size={16} />}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by status"
            data={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            style={{ minWidth: 150 }}
          />
        </Group>

        {loadingProjects ? (
          <Stack align="center" py="xl">
            <Loader size="lg" />
            <Text>Loading projects...</Text>
          </Stack>
        ) : projects.length === 0 ? (
          <Alert 
            icon={<IconAlertCircle size="1rem" />} 
            title="No Projects Found" 
            color="orange"
          >
            You need to create a project with lists first before you can import them to your workspace.
          </Alert>
        ) : filteredProjects.length === 0 ? (
          <Alert 
            icon={<IconAlertCircle size="1rem" />} 
            title="No Matching Projects" 
            color="blue"
          >
            No projects match your search criteria. Try adjusting your filters.
          </Alert>
        ) : (
          <Group align="flex-start" spacing="md" style={{ height: '500px' }}>
            {/* Projects List */}
            <div style={{ flex: 1 }}>
              <Title order={4} mb="sm">
                <Group spacing="xs">
                  <IconFolder size={20} />
                  Projects ({filteredProjects.length})
                </Group>
              </Title>
              
              <ScrollArea style={{ height: '450px' }}>
                <Stack spacing="xs">
                  {filteredProjects.map((project) => (
                    <Card
                      key={project.id}
                      p="sm"
                      withBorder
                      style={{
                        cursor: 'pointer',
                        backgroundColor: selectedProject?.id === project.id ? '#e3f2fd' : 'white',
                        border: selectedProject?.id === project.id ? '2px solid #1976d2' : '1px solid #dee2e6',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => handleProjectSelect(project)}
                    >
                      <Group justify="space-between" align="flex-start">
                        <div style={{ flex: 1 }}>
                          <Text fw={500} size="sm" lineClamp={1}>
                            {project.name}
                          </Text>
                          {project.description && (
                            <Text size="xs" c="dimmed" lineClamp={1} mt={2}>
                              {project.description}
                            </Text>
                          )}
                          <Group spacing="xs" mt="xs">
                            <Text size="xs" c="dimmed">
                              {project.total_lists || 0} lists
                            </Text>
                            <Text size="xs" c="dimmed">
                              {project.total_tasks || 0} tasks
                            </Text>
                          </Group>
                        </div>
                        <Badge 
                          color={getStatusColor(project.status)} 
                          size="xs"
                          variant="light"
                        >
                          {formatStatus(project.status)}
                        </Badge>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </ScrollArea>
            </div>

            {/* Lists from Selected Project */}
            <div style={{ flex: 1 }}>
              <Title order={4} mb="sm">
                <Group spacing="xs">
                  <IconList size={20} />
                  Lists {selectedProject && `from "${selectedProject.name}"`}
                  {selectedLists.length > 0 && (
                    <Badge color="blue" size="sm">
                      {selectedLists.length} selected
                    </Badge>
                  )}
                </Group>
              </Title>
              
              <ScrollArea style={{ height: '450px' }}>
                {!selectedProject ? (
                  <Card p="xl" withBorder style={{ textAlign: 'center', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stack align="center" spacing="sm">
                      <IconFolder size={32} color="#adb5bd" />
                      <Text c="dimmed" size="sm">
                        Select a project to view its lists
                      </Text>
                    </Stack>
                  </Card>
                ) : loadingProjectDetail ? (
                  <Stack align="center" py="xl">
                    <Loader size="md" />
                    <Text size="sm">Loading lists...</Text>
                  </Stack>
                ) : !selectedProjectDetails || !selectedProjectDetails.lists || selectedProjectDetails.lists.length === 0 ? (
                  <Card p="xl" withBorder style={{ textAlign: 'center' }}>
                    <Stack align="center" spacing="sm">
                      <IconList size={32} color="#adb5bd" />
                      <Text c="dimmed" size="sm">
                        No lists found in this project
                      </Text>
                      <Text size="xs" c="dimmed">
                        Create lists in the project first, then import them here
                      </Text>
                    </Stack>
                  </Card>
                ) : (
                  <Stack spacing="xs">
                    {selectedProjectDetails.lists.map((list) => {
                      const isSelected = isListSelected(list)
                      return (
                        <Card
                          key={list.id}
                          p="sm"
                          withBorder
                          style={{
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#e8f5e8' : 'white',
                            border: isSelected ? '2px solid #4caf50' : '1px solid #dee2e6',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => handleListToggle(list)}
                        >
                          <Group justify="space-between" align="center">
                            <div style={{ flex: 1 }}>
                              <Group spacing="xs" align="center">
                                <Text fw={500} size="sm" lineClamp={1}>
                                  {list.name}
                                </Text>
                                {isSelected && (
                                  <IconCheck size={14} color="#4caf50" />
                                )}
                              </Group>
                              <Group spacing="xs" mt="xs">
                                <Text size="xs" c="dimmed">
                                  {list.task_count || 0} tasks
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {Math.round((list.progress || 0) * 100)}% complete
                                </Text>
                              </Group>
                            </div>
                          </Group>
                        </Card>
                      )
                    })}
                  </Stack>
                )}
              </ScrollArea>
            </div>
          </Group>
        )}

        {/* Action Buttons */}
        <Group justify="space-between" mt="md">
          <div>
            {selectedLists.length > 0 && (
              <Text size="sm" c="dimmed">
                {selectedLists.length} list(s) selected for import
              </Text>
            )}
          </div>
          <Group spacing="sm">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImportToWorkspace}
              loading={submitting}
              disabled={selectedLists.length === 0}
              leftSection={<IconCheck size={16} />}
            >
              Import to Workspace ({selectedLists.length})
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  )
}

export default GetListFromProjectsModal