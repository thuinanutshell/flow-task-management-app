import {
  ActionIcon,
  Alert,
  Card,
  ColorSwatch,
  Container,
  Grid,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconEdit,
  IconTag,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EditCategoryModal from "../features/categories/EditCategoryModal";
import TaskCardCompact from "../features/tasks/TaskCardCompact";
import { useCategories } from "../hooks/useCategories";
import { useTasks } from "../hooks/useTasks";
import { categoryService } from "../services/categories";

const CategoryTasks = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [categoryDetail, setCategoryDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { updateCategory, deleteCategory } = useCategories();
  const { taskOptions } = useTasks();

  useEffect(() => {
    loadCategoryTasks();
  }, [categoryId, refreshTrigger]);

  const loadCategoryTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.getCategoryTasks(
        parseInt(categoryId),
      );
      setCategoryDetail(response.data);
    } catch (err) {
      setError(err.message || "Failed to load category tasks");
      setCategoryDetail(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = () => {
    setEditModalOpen(true);
  };

  const handleEditCategorySubmit = async (categoryId, updateData) => {
    try {
      await updateCategory(categoryId, updateData);
      setEditModalOpen(false);
      // Refresh category data
      await loadCategoryTasks();
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryDetail) return;

    const taskCount = categoryDetail.task_count || 0;
    const confirmMessage =
      taskCount > 0
        ? `The category "${categoryDetail.name}" has ${taskCount} task(s). Are you sure you want to delete it? This will remove the category from all tasks.`
        : `Are you sure you want to delete the category "${categoryDetail.name}"?`;

    if (window.confirm(confirmMessage)) {
      try {
        await deleteCategory(parseInt(categoryId));
        navigate("/categories");
      } catch (error) {
        console.error("Failed to delete category:", error);
      }
    }
  };

  const handleTaskUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate task count
  const getTaskCount = () => {
    return categoryDetail?.tasks?.length || 0;
  };

  if (loading) {
    return (
      <Container size="xl">
        <Stack align="center" justify="center" h={400}>
          <Loader size="lg" />
          <Text>Loading category tasks...</Text>
        </Stack>
      </Container>
    );
  }

  if (error || !categoryDetail) {
    return (
      <Container size="xl">
        <Stack spacing="lg">
          <Group spacing="md">
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={() => navigate("/categories")}
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Title order={1}>Category Not Found</Title>
          </Group>

          {error && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              title="Error"
              color="red"
            >
              {error}
            </Alert>
          )}

          <Button onClick={() => navigate("/categories")}>
            Back to Categories
          </Button>
        </Stack>
      </Container>
    );
  }

  const taskCount = getTaskCount();

  return (
    <Container size="xl">
      <Stack spacing="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Group spacing="md">
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={() => navigate("/categories")}
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Group spacing="sm">
              <ColorSwatch color={categoryDetail.color} size={32} />
              <div>
                <Title order={1}>{categoryDetail.name}</Title>
                <Text c="dimmed" size="lg" mt="xs">
                  {taskCount} tasks
                </Text>
              </div>
            </Group>
          </Group>

          <Group spacing="sm">
            <ActionIcon variant="subtle" size="lg" onClick={handleEditCategory}>
              <IconEdit size={20} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="lg"
              color="red"
              onClick={handleDeleteCategory}
            >
              <IconTrash size={20} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Tasks Section */}
        <div>
          <Title order={2} mb="md">
            Tasks
          </Title>

          {categoryDetail.tasks && categoryDetail.tasks.length > 0 ? (
            <Grid>
              {categoryDetail.tasks.map((task) => (
                <Grid.Col key={task.id} span={{ base: 12, sm: 6, md: 4 }}>
                  <TaskCardCompact task={task} onUpdate={handleTaskUpdate} />
                </Grid.Col>
              ))}
            </Grid>
          ) : (
            // Empty State
            <Card withBorder p="xl" style={{ textAlign: "center" }}>
              <Stack align="center" spacing="md">
                <IconTag size={48} color="#adb5bd" />
                <div>
                  <Text fw={500} c="dimmed">
                    No tasks in this category
                  </Text>
                  <Text size="sm" c="dimmed" mt="xs">
                    Create tasks and assign them to this category to see them
                    here
                  </Text>
                </div>
                <Button onClick={() => navigate("/dashboard")} mt="md">
                  Go to Dashboard
                </Button>
              </Stack>
            </Card>
          )}
        </div>

        {/* Edit Category Modal */}
        <EditCategoryModal
          opened={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={handleEditCategorySubmit}
          category={categoryDetail}
        />
      </Stack>
    </Container>
  );
};

export default CategoryTasks;
