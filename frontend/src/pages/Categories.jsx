// pages/Categories.jsx
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
import { IconAlertCircle, IconPlus, IconTag } from '@tabler/icons-react'
import { useState } from 'react'
import CategoryCard from '../features/categories/CategoryCard'
import CreateCategoryModal from '../features/categories/CreateCategoryModal'
import EditCategoryModal from '../features/categories/EditCategoryModal'
import { useCategories } from '../hooks/useCategories'

const Categories = () => {
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false)
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)

  // Use the categories hook
  const {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory
  } = useCategories()

  const handleCreateCategory = () => {
    setCreateCategoryModalOpen(true)
  }

  const handleCreateCategorySubmit = async (categoryData) => {
    await createCategory(categoryData)
  }

  const handleEditCategory = (category) => {
    setSelectedCategory(category)
    setEditCategoryModalOpen(true)
  }

  const handleEditCategorySubmit = async (categoryId, updateData) => {
    await updateCategory(categoryId, updateData)
    setSelectedCategory(null)
  }

  const handleDeleteCategory = async (category) => {
    if (category.task_count > 0) {
      // Show warning if category has tasks
      if (window.confirm(
        `The category "${category.name}" has ${category.task_count} task(s). ` +
        `Are you sure you want to delete it? This will remove the category from all tasks.`
      )) {
        await deleteCategory(category.id)
      }
    } else {
      if (window.confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
        await deleteCategory(category.id)
      }
    }
  }

  const handleViewCategoryTasks = (category) => {
    // TODO: Navigate to category tasks view or open modal
    console.log('View tasks for category:', category)
  }

  if (loading) {
    return (
      <Container size="xl">
        <Stack align="center" justify="center" h={400}>
          <Loader size="lg" />
          <Text>Loading your categories...</Text>
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
            <Title order={1}>Categories</Title>
            <Text c="dimmed" size="lg" mt="xs">
              Organize your tasks with color-coded categories
            </Text>
          </div>
          
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreateCategory}
          >
            Create Category
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
          {categories.length === 0 ? (
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
                <IconTag size={48} color="#adb5bd" />
                <div>
                  <Title order={3} c="dimmed">No categories yet</Title>
                  <Text c="dimmed" mt="xs" size="sm">
                    Create your first category to help organize your tasks
                  </Text>
                </div>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={handleCreateCategory}
                  mt="md"
                >
                  Create Your First Category
                </Button>
              </Stack>
            </Box>
          ) : (
            // Categories Grid
            <Grid>
              {categories.map((category) => (
                <Grid.Col key={category.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                  <CategoryCard
                    category={category}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteCategory}
                    onView={handleViewCategoryTasks}
                    onClick={handleViewCategoryTasks}
                  />
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Box>

        {/* Create Category Modal */}
        <CreateCategoryModal
          opened={createCategoryModalOpen}
          onClose={() => setCreateCategoryModalOpen(false)}
          onSuccess={handleCreateCategorySubmit}
        />

        {/* Edit Category Modal */}
        <EditCategoryModal
          opened={editCategoryModalOpen}
          onClose={() => {
            setEditCategoryModalOpen(false)
            setSelectedCategory(null)
          }}
          onSuccess={handleEditCategorySubmit}
          category={selectedCategory}
        />
      </Stack>
    </Container>
  )
}

export default Categories