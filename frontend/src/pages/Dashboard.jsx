// pages/Dashboard.jsx - Updated to match screenshot
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
import { useAuth } from '../context/AuthContext'
import CreateListModal from '../features/lists/CreateListModal'
import ListCard from '../features/lists/ListCard'
import AddTaskModal from '../features/tasks/AddTaskModal'
import { useLists } from '../hooks/useLists'
import { useTasks } from '../hooks/useTasks'

const Dashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('board')
  const [createListModalOpen, setCreateListModalOpen] = useState(false)
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false)
  const [selectedList, setSelectedList] = useState(null)
  
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
    await createList(listData)
  }

  const handleGetListFromProjects = () => {
    // TODO: Open modal to select from existing project lists
    console.log('Get list from projects')
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
    if (window.confirm(`Are you sure you want to delete "${list.name}"? This will also delete all tasks in this list.`)) {
      await deleteList(list.id)
    }
  }

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
            {lists.length === 0 ? (
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
              // Fixed 3-Column Layout like in screenshot
              <Grid gutter="md">
                {lists.map((list) => (
                  <Grid.Col 
                    key={list.id} 
                    span={4} // Fixed 3 columns (12/3 = 4)
                  >
                    <ListCard 
                      list={list}
                      onAddTask={handleAddTask}
                      onEdit={handleEditList}
                      onDelete={handleDeleteList}
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