import {
    Button,
    Group,
    Modal,
    NumberInput,
    Stack,
    TextInput
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconList, IconTrendingUp } from '@tabler/icons-react'
import { useEffect, useState } from 'react'

const EditListModal = ({ 
  opened, 
  onClose, 
  onSuccess,
  list
}) => {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({
    initialValues: {
      name: '',
      progress: 0
    },
    validate: {
      name: (value) => 
        value.trim().length > 0 ? null : 'List name is required',
      progress: (value) =>
        value >= 0 && value <= 1 ? null : 'Progress must be between 0 and 1'
    }
  })

  // Update form when list changes
  useEffect(() => {
    if (list) {
      form.setValues({
        name: list.name || '',
        progress: list.progress || 0
      })
    }
  }, [list])

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true)
      
      // Call the onSuccess callback with the form data
      if (onSuccess) {
        await onSuccess(list.id, {
          name: values.name.trim(),
          progress: values.progress
        })
      }
      
      // Close modal on success
      onClose()
    } catch (error) {
      // Error handling is done in the parent component (useLists hook)
      console.error('Update list error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Edit List"
      size="md"
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="md">
          <TextInput
            label="List Name"
            placeholder="Enter list name"
            required
            leftSection={<IconList size={16} />}
            {...form.getInputProps('name')}
            disabled={submitting}
          />

          <NumberInput
            label="Progress"
            placeholder="Enter progress (0.0 to 1.0)"
            min={0}
            max={1}
            step={0.1}
            precision={1}
            leftSection={<IconTrendingUp size={16} />}
            {...form.getInputProps('progress')}
            disabled={submitting}
            description="Progress value between 0.0 (0%) and 1.0 (100%)"
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
              Update List
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default EditListModal