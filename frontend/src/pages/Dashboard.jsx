// pages/Dashboard.jsx - Fixed version with proper list flows
import {
    Alert,
    Box,
    Button,
    Container,
    Grid,
    Group,
    Loader,
    SegmentedControl,
    Stack,
    Text,
    Title
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconFolder, IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import CreateListModal from '../features/lists/CreateListModal'
import GetListFromProjectsModal from '../features/lists/GetListFromProjectsModal'
import ListCard from '../features/lists/ListCard'
import AddTaskModal from '../features/tasks/AddTaskModal'
import { useLists } from '../hooks/useLists'
import { useTasks } from '../hooks/useTasks'

const Dashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('board')
  const [createListModalOpen, setCreateListModalOpen] = useState(false)
  const [getListModalOpen, setGetListModalOpen] = useState(false)
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false)
  const [selectedList, setSelectedList] = useState(null)
  
  // Workspace lists - lists imported from projects for daily work
  const [workspaceLists, setWorkspaceLists] = useState([])
  
  // Use the hooks
  const { lists, loading, error, createList, deleteList } = useLists()
  const { createTask } = useTasks()

  // Get current date
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleCreateList = () => {
    setCreateListModalOpen(true)
  }

  const handleCreateListSubmit = async (listData) => {
    // This creates a new list and assigns it to a project
    await createList(listData)
  }

  const handleGetListFromProjects = () => {
    setGetListModalOpen(true)
  }

  const handleGetListsSuccess = async (selectedLists) => {
    try {
      // Import selected lists to workspace (don't create new ones)
      const newWorkspaceLists = selectedLists.map(list => ({
        ...list,
        isWorkspaceList: true, // Flag to identify workspace lists
        originalProjectId: list.project_id,
        originalProjectName: list.project_name || 'Unknown Project',
        // Add project info if missing
        project_name: list.project_name || 'Unknown Project',
        project_id: list.project_id,
        project_status: list.project_status || 'unknown'
      }))
      
      setWorkspaceLists(prev => {
        // Avoid duplicates by checking if list ID already exists
        const existingIds = prev.map(l => l.id)
        const uniqueNewLists = newWorkspaceLists.filter(l => !existingIds.includes(l.id))
        return [...prev, ...uniqueNewLists]
      })
      
      notifications.show({
        title: 'Success',
        message: `Added ${selectedLists.length} list(s) to workspace`,
        color: 'green'
      })
    } catch (error) {
      console.error('Failed to import lists:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to import lists to workspace',
        color: 'red'
      })
    }
  }

  const handleAddTask = (list) => {
    setSelectedList(list)
    setAddTaskModalOpen(true)
  }

  const handleAddTaskSubmit = async (taskData) => {
    await createTask(taskData)
    // Lists will auto-refresh their tasks via their own useEffect
  }

  const handleEditList = (list) => {
    // TODO: Open edit list modal
    console.log('Edit list:', list)
  }

  const handleDeleteList = async (list) => {
    if (list.isWorkspaceList) {
      // Remove from workspace (local state only)
      setWorkspaceLists(prev => prev.filter(l => l.id !== list.id))
      notifications.show({
        title: 'Success',
        message: 'List removed from workspace',
        color: 'green'
      })
    } else {
      // Delete actual list
      if (window.confirm(`Are you sure you want to delete "${list.name}"? This will also delete all tasks in this list.`)) {
        await deleteList(list.id)
      }
    }
  }

  const handleRemoveFromWorkspace = (list) => {
    // Remove list from workspace without deleting it from the project
    setWorkspaceLists(prev => prev.filter(l => l.id !== list.id))
    notifications.show({
      title: 'Success',
      message: 'List removed from workspace',
      color: 'green'
    })
  }

  // Combine created lists and workspace lists for display
  const allDisplayLists = [
    ...lists.map(list => ({ ...list, isWorkspaceList: false })),
    ...workspaceLists
  ]

  if (loading) {
    return (
      <Container size="xl">
        <Stack align="center" justify="center" h={400}>
          <Loader size="lg" />
          <Text>Loading your dashboard...</Text>
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
            <Title order={1} size="h1">Dashboard</Title>
            <Text c="dimmed" size="md" mt="xs">
              {getCurrentDate()}
            </Text>
            {workspaceLists.length > 0 && (
              <Text size="sm" c="blue" mt="xs">
                {workspaceLists.length} list(s) imported from projects
              </Text>
            )}
          </div>
        </Group>

        {/* View Toggle */}
        <Group justify="space-between" align="center">
          <SegmentedControl
            value={activeTab}
            onChange={setActiveTab}
            data={[
              { label: 'Board', value: 'board' },
              { label: 'Progress', value: 'progress' }
            ]}
            size="md"
          />

          <Group spacing="sm">
            <Button
              leftSection={<IconFolder size={16} />}
              variant="outline"
              onClick={handleGetListFromProjects}
            >
              Get List From Projects
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleCreateList}
            >
              Add New List
            </Button>
          </Group>
        </Group>

        {/* Error Display */}
        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {/* Main Content Area */}
        {activeTab === 'board' ? (
          <Box>
            {allDisplayLists.length === 0 ? (
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
                    <Title order={3} c="dimmed">No lists yet</Title>
                    <Text c="dimmed" mt="xs" size="sm">
                      Get started by creating your first list or importing from projects
                    </Text>
                  </div>
                  <Group mt="md">
                    <Button
                      leftSection={<IconFolder size={16} />}
                      variant="outline"
                      onClick={handleGetListFromProjects}
                    >
                      Get List From Projects
                    </Button>
                    <Button
                      leftSection={<IconPlus size={16} />}
                      onClick={handleCreateList}
                    >
                      Create New List
                    </Button>
                  </Group>
                </Stack>
              </Box>
            ) : (
              // Lists Grid - Fixed 3-Column Layout
              <Grid gutter="md">
                {allDisplayLists.map((list) => (
                  <Grid.Col 
                    key={`${list.id}-${list.isWorkspaceList ? 'workspace' : 'created'}`} 
                    span={4} // Fixed 3 columns (12/3 = 4)
                  >
                    <ListCard 
                      list={list}
                      onAddTask={handleAddTask}
                      onEdit={handleEditList}
                      onDelete={handleDeleteList}
                      onRemoveFromWorkspace={list.isWorkspaceList ? handleRemoveFromWorkspace : null}
                      isWorkspaceList={list.isWorkspaceList}
                    />
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </Box>
        ) : (
          // Progress View
          <Box>
            <Box
              p="xl"
              style={{
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                minHeight: '300px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <Stack align="center" spacing="md">
                <Title order={3} c="dimmed">Progress View</Title>
                <Text c="dimmed" size="sm">
                  This will show your task completion progress and analytics
                </Text>
                {allDisplayLists.length > 0 && (
                  <Stack spacing="xs" mt="md">
                    <Text size="sm" c="dimmed">Current Statistics:</Text>
                    <Group spacing="md" justify="center">
                      <Text size="sm">
                        <strong>{lists.length}</strong> created lists
                      </Text>
                      <Text size="sm">
                        <strong>{workspaceLists.length}</strong> imported lists
                      </Text>
                      <Text size="sm">
                        <strong>{allDisplayLists.reduce((sum, list) => sum + (list.total_tasks || 0), 0)}</strong> total tasks
                      </Text>
                    </Group>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Box>
        )}

        {/* Modals */}
        <CreateListModal
          opened={createListModalOpen}
          onClose={() => setCreateListModalOpen(false)}
          onSuccess={handleCreateListSubmit}
        />

        <GetListFromProjectsModal
          opened={getListModalOpen}
          onClose={() => setGetListModalOpen(false)}
          onSuccess={handleGetListsSuccess}
        />

        <AddTaskModal
          opened={addTaskModalOpen}
          onClose={() => {
            setAddTaskModalOpen(false)
            setSelectedList(null)
          }}
          onSuccess={handleAddTaskSubmit}
          listId={selectedList?.id}
          listName={selectedList?.name}
        />
      </Stack>
    </Container>
  )
}

export default Dashboard