// features/categories/EditCategoryModal.jsx
import {
    Button,
    ColorInput,
    Group,
    Modal,
    Stack,
    TextInput
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconPalette, IconTag } from '@tabler/icons-react'
import { useEffect, useState } from 'react'

const EditCategoryModal = ({ 
  opened, 
  onClose, 
  onSuccess,
  category
}) => {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({
    initialValues: {
      name: '',
      color: '#228be6'
    },
    validate: {
      name: (value) => 
        value.trim().length > 0 ? null : 'Category name is required',
      color: (value) => {
        // Validate hex color format
        const hexPattern = /^#[0-9A-Fa-f]{6}$/
        return hexPattern.test(value) ? null : 'Please select a valid color'
      }
    }
  })

  // Update form when category changes
  useEffect(() => {
    if (category) {
      form.setValues({
        name: category.name || '',
        color: category.color || '#228be6'
      })
    }
  }, [category])

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true)
      
      // Call the onSuccess callback with the form data
      if (onSuccess) {
        await onSuccess(category.id, {
          name: values.name.trim(),
          color: values.color
        })
      }
      
      // Close modal on success
      onClose()
    } catch (error) {
      // Error handling is done in the parent component (useCategories hook)
      console.error('Update category error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  // Predefined color options
  const colorPresets = [
    '#228be6', // Blue
    '#40c057', // Green  
    '#fd7e14', // Orange
    '#fa5252', // Red
    '#be4bdb', // Purple
    '#15aabf', // Cyan
    '#fab005', // Yellow
    '#fd79a8', // Pink
    '#6c5ce7', // Indigo
    '#00b894'  // Teal
  ]

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Edit Category"
      size="md"
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="md">
          <TextInput
            label="Category Name"
            placeholder="Enter category name"
            required
            leftSection={<IconTag size={16} />}
            {...form.getInputProps('name')}
            disabled={submitting}
          />

          <ColorInput
            label="Category Color"
            placeholder="Select or enter color"
            required
            leftSection={<IconPalette size={16} />}
            {...form.getInputProps('color')}
            disabled={submitting}
            swatches={colorPresets}
            description="Choose a color to help identify this category"
          />

          <Group justify="flex-end" mt="md">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              loading={submitting}
            >
              Update Category
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default EditCategoryModal