import {
  ActionIcon,
  Alert,
  Button,
  Card,
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
  IconExternalLink,
  IconList,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EditListModal from "../features/lists/EditListModal";
import AddTaskModal from "../features/tasks/AddTaskModal";
import TaskCardCompact from "../features/tasks/TaskCardCompact";
import { useTasks } from "../hooks/useTasks";
import { listService } from "../services/lists";

const ListTasks = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [listDetail, setListDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { createTask } = useTasks();

  useEffect(() => {
    loadListTasks();
  }, [listId, refreshTrigger]);

  const loadListTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listService.getListById(parseInt(listId));
      setListDetail(response.data);
    } catch (err) {
      setError(err.message || "Failed to load list tasks");
      setListDetail(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEditList = () => {
    setEditModalOpen(true);
  };

  const handleEditListSubmit = async (listId, updateData) => {
    try {
      await listService.updateList(listId, updateData);
      setEditModalOpen(false);
      // Refresh list data
      await loadListTasks();
    } catch (error) {
      console.error("Failed to update list:", error);
    }
  };

  const handleDeleteList = async () => {
    if (!listDetail) return;

    const taskCount = listDetail.tasks?.length || 0;
    const confirmMessage =
      taskCount > 0
        ? `The list "${listDetail.name}" has ${taskCount} task(s). Are you sure you want to delete it? This will also delete all tasks in this list.`
        : `Are you sure you want to delete the list "${listDetail.name}"?`;

    if (window.confirm(confirmMessage)) {
      try {
        await listService.deleteList(parseInt(listId));
        navigate("/dashboard");
      } catch (error) {
        console.error("Failed to delete list:", error);
      }
    }
  };

  const handleAddTask = () => {
    setAddTaskModalOpen(true);
  };

  const handleAddTaskSubmit = async (taskData) => {
    try {
      await createTask(taskData);
      setAddTaskModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleTaskUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleViewInProject = () => {
    if (listDetail?.project_id) {
      navigate(`/projects/${listDetail.project_id}`);
    }
  };

  // Calculate task count
  const getTaskCount = () => {
    return listDetail?.tasks?.length || 0;
  };

  if (loading) {
    return (
      <Container size="xl">
        <Stack align="center" justify="center" h={400}>
          <Loader size="lg" />
          <Text>Loading list tasks...</Text>
        </Stack>
      </Container>
    );
  }

  if (error || !listDetail) {
    return (
      <Container size="xl">
        <Stack spacing="lg">
          <Group spacing="md">
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={() => navigate("/dashboard")}
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Title order={1}>List Not Found</Title>
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

          <Button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
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
              onClick={() => navigate("/dashboard")}
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <div>
              <Title order={1}>{listDetail.name}</Title>
              <Group spacing="sm" mt="xs">
                <Text c="dimmed" size="lg">
                  {taskCount} tasks
                </Text>
                {listDetail.project_id && (
                  <>
                    <Text c="dimmed">•</Text>
                    <Button
                      variant="subtle"
                      size="sm"
                      leftSection={<IconExternalLink size={14} />}
                      onClick={handleViewInProject}
                    >
                      View in Project
                    </Button>
                  </>
                )}
              </Group>
            </div>
          </Group>

          <Group spacing="sm">
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleAddTask}
            >
              Add Task
            </Button>
            <ActionIcon variant="subtle" size="lg" onClick={handleEditList}>
              <IconEdit size={20} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="lg"
              color="red"
              onClick={handleDeleteList}
            >
              <IconTrash size={20} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Tasks Section */}
        <div>
          <Group justify="space-between" align="center" mb="md">
            <Title order={2}>Tasks</Title>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleAddTask}
              variant="outline"
            >
              Add Task
            </Button>
          </Group>

          {listDetail.tasks && listDetail.tasks.length > 0 ? (
            <Grid>
              {listDetail.tasks.map((task) => (
                <Grid.Col key={task.id} span={{ base: 12, sm: 6, md: 4 }}>
                  <TaskCardCompact task={task} onUpdate={handleTaskUpdate} />
                </Grid.Col>
              ))}
            </Grid>
          ) : (
            // Empty State
            <Card withBorder p="xl" style={{ textAlign: "center" }}>
              <Stack align="center" spacing="md">
                <IconList size={48} color="#adb5bd" />
                <div>
                  <Text fw={500} c="dimmed">
                    No tasks in this list
                  </Text>
                  <Text size="sm" c="dimmed" mt="xs">
                    Add your first task to get started
                  </Text>
                </div>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={handleAddTask}
                  mt="md"
                >
                  Add First Task
                </Button>
              </Stack>
            </Card>
          )}
        </div>

        {/* Modals */}
        <EditListModal
          opened={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={handleEditListSubmit}
          list={listDetail}
        />

        <AddTaskModal
          opened={addTaskModalOpen}
          onClose={() => setAddTaskModalOpen(false)}
          onSuccess={handleAddTaskSubmit}
          listId={parseInt(listId)}
          listName={listDetail?.name}
        />
      </Stack>
    </Container>
  );
};

export default ListTasks;
