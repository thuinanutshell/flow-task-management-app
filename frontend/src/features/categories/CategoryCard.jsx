// features/categories/CategoryCard.jsx
import {
    ActionIcon,
    Badge,
    Card,
    ColorSwatch,
    Group,
    Menu,
    Stack,
    Text
} from '@mantine/core'
import {
    IconDots,
    IconEdit,
    IconEye,
    IconTag,
    IconTrash
} from '@tabler/icons-react'

const CategoryCard = ({ 
  category, 
  onEdit, 
  onDelete, 
  onView,
  onClick 
}) => {

  const handleCardClick = () => {
    if (onClick) {
      onClick(category)
    }
  }

  return (
    <Card 
      shadow="sm" 
      padding="lg" 
      radius="md" 
      withBorder
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={handleCardClick}
    >
      <Stack spacing="sm">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Group spacing="sm" align="center">
            <ColorSwatch 
              color={category.color} 
              size={24}
            />
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
              {onView && (
                <Menu.Item 
                  leftSection={<IconEye size={14} />}
                  onClick={(e) => {
                    e.stopPropagation()
                    onView(category)
                  }}
                >
                  View Tasks
                </Menu.Item>
              )}
              
              {onEdit && (
                <Menu.Item 
                  leftSection={<IconEdit size={14} />}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(category)
                  }}
                >
                  Edit Category
                </Menu.Item>
              )}
              
              {onDelete && (
                <Menu.Item 
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(category)
                  }}
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

        {/* Task completion badge if category has tasks */}
        {category.task_count > 0 && (
          <Badge 
            color={category.color} 
            variant="light"
            size="sm"
          >
            {Math.round(((category.completed_task_count || 0) / category.task_count) * 100)}% complete
          </Badge>
        )}
      </Stack>
    </Card>
  )
}

export default CategoryCard