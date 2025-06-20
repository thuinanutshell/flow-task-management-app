// pages/Dashboard.jsx - Fixed version with proper workspace lists
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
import { IconAlertCircle, IconFolder, IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import CreateListModal from '../features/lists/CreateListModal'
import GetListFromProjectsModal from '../features/lists/GetListFromProjectsModal'
import ListCard from '../features/lists/ListCard'
import AddTaskModal from '../features/tasks/AddTaskModal'
import { useTasks } from '../hooks/useTasks'
import { useWorkspaceLists } from '../hooks/useWorkspaceLists'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('board')
  const [createListModalOpen, setCreateListModalOpen] = useState(false)
  const [getListModalOpen, setGetListModalOpen] = useState(false)
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false)
  const [selectedList, setSelectedList] = useState(null)
  
  // Use the new workspace lists hook
  const {
    workspaceLists,
    loading,
    error,
    createListInWorkspace,
    importListsToWorkspace,
    removeFromWorkspace,
    deleteListCompletely,
  } = useWorkspaceLists()
  
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

  // Create a list and add it to workspace
  const handleCreateListSubmit = async (listData) => {
    await createListInWorkspace(listData)
  }

  const handleGetListFromProjects = () => {
    setGetListModalOpen(true)
  }

  const handleGetListsSuccess = async (selectedLists) => {
    await importListsToWorkspace(selectedLists)
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
      // This is an imported list - just remove from workspace
      if (window.confirm(`Remove "${list.name}" from workspace? This won't delete the list from the project.`)) {
        await removeFromWorkspace(list.id)
      }
    } else {
      // This is a dashboard-created list - delete completely
      if (window.confirm(`Are you sure you want to delete "${list.name}"? This will also delete all tasks in this list.`)) {
        await deleteListCompletely(list.id)
      }
    }
  }

  const handleRemoveFromWorkspace = async (list) => {
    // Remove list from workspace without deleting it from the project
    await removeFromWorkspace(list.id)
  }

  // Separate lists by type for display
  const dashboardCreatedLists = workspaceLists.filter(list => !list.isWorkspaceList)
  const importedLists = workspaceLists.filter(list => list.isWorkspaceList)
  const totalTasks = workspaceLists.reduce((sum, list) => sum + (list.total_tasks || 0), 0)

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
              Import From Projects
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleCreateList}
            >
              Create New List
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
            {workspaceLists.length === 0 ? (
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
                    <Title order={3} c="dimmed">No lists in workspace</Title>
                    <Text c="dimmed" mt="xs" size="sm">
                      Create a new list or import existing lists from your projects
                    </Text>
                  </div>
                  <Group mt="md">
                    <Button
                      leftSection={<IconFolder size={16} />}
                      variant="outline"
                      onClick={handleGetListFromProjects}
                    >
                      Import From Projects
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
                {workspaceLists.map((list) => (
                  <Grid.Col 
                    key={`${list.id}-${list.isWorkspaceList ? 'imported' : 'created'}`} 
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
                {workspaceLists.length > 0 && (
                  <Stack spacing="xs" mt="md">
                    <Text size="sm" c="dimmed">Current Statistics:</Text>
                    <Group spacing="md" justify="center">
                      <Text size="sm">
                        <strong>{dashboardCreatedLists.length}</strong> created lists
                      </Text>
                      <Text size="sm">
                        <strong>{importedLists.length}</strong> imported lists
                      </Text>
                      <Text size="sm">
                        <strong>{totalTasks}</strong> total tasks
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
          hideProjectSelect={false}
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