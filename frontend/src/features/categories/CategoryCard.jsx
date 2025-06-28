import {
  ActionIcon,
  Badge,
  Card,
  ColorSwatch,
  Group,
  Menu,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconDots,
  IconEdit,
  IconEye,
  IconTag,
  IconTrash,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

const CategoryCard = ({ category, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    // Navigate to category tasks page
    navigate(`/categories/${category.id}/tasks`);
  };

  const handleViewTasks = (e) => {
    e.stopPropagation();
    navigate(`/categories/${category.id}/tasks`);
  };

  const handleEditCategory = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(category);
    }
  };

  const handleDeleteCategory = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(category);
    }
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        cursor: "pointer",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onClick={handleCardClick}
    >
      <Stack spacing="sm">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Group spacing="sm" align="center">
            <ColorSwatch color={category.color} size={24} />
            <Text fw={500} size="md" lineClamp={2}>
              {category.name}
            </Text>
          </Group>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={(e) => e.stopPropagation()}
              >
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEye size={14} />}
                onClick={handleViewTasks}
              >
                View Tasks
              </Menu.Item>

              {onEdit && (
                <Menu.Item
                  leftSection={<IconEdit size={14} />}
                  onClick={handleEditCategory}
                >
                  Edit Category
                </Menu.Item>
              )}

              {onDelete && (
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={handleDeleteCategory}
                >
                  Delete Category
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>

        {/* Stats */}
        <Group spacing="md">
          <Group spacing="xs">
            <IconTag size={14} color="#868e96" />
            <Text size="sm" c="dimmed">
              {category.task_count || 0} tasks
            </Text>
          </Group>
        </Group>
      </Stack>
    </Card>
  );
};

export default CategoryCard;
