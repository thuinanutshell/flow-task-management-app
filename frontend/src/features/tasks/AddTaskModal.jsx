import {
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea
} from '@mantine/core'
import { useForm } from '@mantine/form'
import {
  IconChecklist,
  IconClock,
  IconFlag,
  IconTag
} from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { useExperiments } from '../../hooks/useExperiments'
import { taskService } from '../../services/tasks'

const AddTaskModal = ({ 
  opened, 
  onClose, 
  onSuccess,
  listId,
  listName
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [taskOptions, setTaskOptions] = useState(null)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [experimentIntervention, setExperimentIntervention] = useState(null)
  const [checkingIntervention, setCheckingIntervention] = useState(false)

  const { checkTaskIntervention } = useExperiments()
  
  // Use refs to store values and avoid dependency issues
  const debounceTimeoutRef = useRef(null)
  const currentValuesRef = useRef({ categoryId: '', plannedDuration: 25 })
  const isModalOpenRef = useRef(false)

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      priority: 'medium',
      plannedDuration: 25,
      categoryId: ''
    },
    validate: {
      name: (value) => 
        value.trim().length > 0 ? null : 'Task name is required',
      priority: (value) =>
        value ? null : 'Please select a priority',
      plannedDuration: (value) =>
        value && value > 0 ? null : 'Planned duration must be greater than 0'
    }
  })

  // Update refs when form values change
  useEffect(() => {
    currentValuesRef.current = {
      categoryId: form.values.categoryId,
      plannedDuration: form.values.plannedDuration
    }
  }, [form.values.categoryId, form.values.plannedDuration])

  // Track modal open state
  useEffect(() => {
    isModalOpenRef.current = opened
    
    if (opened) {
      loadTaskOptions()
    } else {
      // Reset state when modal closes
      setExperimentIntervention(null)
      setCheckingIntervention(false)
      
      // Clear any pending timeouts
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
        debounceTimeoutRef.current = null
      }
    }
  }, [opened])

  // Function to check intervention
  const checkInterventionDebounced = (categoryId, plannedDuration) => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(async () => {
      // Double-check modal is still open and values haven't changed
      if (!isModalOpenRef.current) {
        return
      }

      const currentValues = currentValuesRef.current
      if (currentValues.categoryId !== categoryId || currentValues.plannedDuration !== plannedDuration) {
        return // Values changed while we were waiting
      }

      try {
        setCheckingIntervention(true)
        console.log('🔴 Checking intervention for:', { categoryId, plannedDuration })
        
        const intervention = await checkTaskIntervention(
          parseInt(categoryId), 
          plannedDuration
        )
        
        console.log('✅ Intervention result:', intervention)
        
        // Only update if modal is still open and values haven't changed
        if (isModalOpenRef.current) {
          const stillCurrentValues = currentValuesRef.current
          if (stillCurrentValues.categoryId === categoryId && stillCurrentValues.plannedDuration === plannedDuration) {
            setExperimentIntervention(intervention)
          }
        }
      } catch (error) {
        console.error('❌ Failed to check intervention:', error)
        if (isModalOpenRef.current) {
          setExperimentIntervention(null)
        }
      } finally {
        if (isModalOpenRef.current) {
          setCheckingIntervention(false)
        }
      }
    }, 500)
  }

  // Watch for form value changes and trigger intervention check
  useEffect(() => {
    if (!opened) return

    const { categoryId, plannedDuration } = currentValuesRef.current

    if (categoryId && plannedDuration) {
      checkInterventionDebounced(categoryId, plannedDuration)
    } else {
      // Clear intervention if either field is empty
      setExperimentIntervention(null)
      setCheckingIntervention(false)
      
      // Clear any pending timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
        debounceTimeoutRef.current = null
      }
    }

    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [form.values.categoryId, form.values.plannedDuration, opened])

  const loadTaskOptions = async () => {
    try {
      setLoadingOptions(true)
      const response = await taskService.getTaskCreateOptions()
      setTaskOptions(response.data)
    } catch (error) {
      console.error('Failed to load task options:', error)
      setTaskOptions({ categories: [], priorities: ['high', 'medium', 'low'] })
    } finally {
      setLoadingOptions(false)
    }
  }

  // Handle accepting experiment suggestion
  const handleAcceptSuggestion = () => {
    if (experimentIntervention?.suggested_estimate) {
      form.setFieldValue('plannedDuration', experimentIntervention.suggested_estimate)
      setExperimentIntervention(prev => ({
        ...prev,
        user_accepted: true
      }))
    }
  }

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true)
      
      const taskData = {
        name: values.name.trim(),
        description: values.description.trim(),
        listId: listId,
        priority: values.priority,
        plannedDuration: values.plannedDuration,
        categoryId: values.categoryId || null
      }

      // Add experiment data if available
      if (experimentIntervention?.has_intervention) {
        taskData.experimentData = {
          experiment_id: experimentIntervention.experiment_id,
          should_apply: experimentIntervention.should_apply,
          intervention_applied: experimentIntervention.user_accepted || false,
          original_estimate: experimentIntervention.original_estimate,
          suggested_estimate: experimentIntervention.suggested_estimate,
          final_estimate: values.plannedDuration,
          notes: experimentIntervention.user_accepted ? 'User accepted suggestion' : 'User kept original estimate'
        }
      }
      
      if (onSuccess) {
        await onSuccess(taskData)
      }
      
      form.reset()
      setExperimentIntervention(null)
      onClose()
    } catch (error) {
      console.error('Create task error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    // Clear any pending timeouts
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }
    
    form.reset()
    setExperimentIntervention(null)
    setCheckingIntervention(false)
    onClose()
  }

  // Prepare options for selects
  const priorityOptions = taskOptions?.priorities?.map(priority => ({
    value: priority,
    label: priority.charAt(0).toUpperCase() + priority.slice(1)
  })) || [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ]

  const categoryOptions = [
    { value: '', label: 'No Category' },
    ...(taskOptions?.categories?.map(category => ({
      value: category.id.toString(),
      label: category.name
    })) || [])
  ]

  // Show intervention UI logic
  const shouldShowIntervention = (
    experimentIntervention?.has_intervention && 
    experimentIntervention?.should_apply && 
    experimentIntervention?.suggested_estimate && 
    !experimentIntervention?.user_accepted
  )

  const showAcceptedMessage = experimentIntervention?.user_accepted

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Add New Task"
      size="md"
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="md">
          <TextInput
            label="Task Name"
            placeholder="Enter task name"
            required
            leftSection={<IconChecklist size={16} />}
            {...form.getInputProps('name')}
            disabled={submitting}
          />

          <Textarea
            label="Description"
            placeholder="Enter task description (optional)"
            minRows={3}
            {...form.getInputProps('description')}
            disabled={submitting}
          />

          <Select
            label="Priority"
            placeholder={loadingOptions ? "Loading priorities..." : "Select priority"}
            data={priorityOptions}
            required
            leftSection={
              loadingOptions ? (
                <Loader size={16} />
              ) : (
                <IconFlag size={16} />
              )
            }
            {...form.getInputProps('priority')}
            disabled={submitting || loadingOptions}
          />

          <Select
            label="Category"
            placeholder={loadingOptions ? "Loading categories..." : "Select category (optional)"}
            data={categoryOptions}
            searchable
            leftSection={
              loadingOptions ? (
                <Loader size={16} />
              ) : (
                <IconTag size={16} />
              )
            }
            {...form.getInputProps('categoryId')}
            disabled={submitting || loadingOptions}
          />

          <NumberInput
            label="Planned Duration (minutes)"
            placeholder="Enter planned duration"
            required
            min={1}
            max={480}
            leftSection={<IconClock size={16} />}
            {...form.getInputProps('plannedDuration')}
            disabled={submitting}
          />

          {/* Show loading state while checking intervention */}
          {checkingIntervention && (
            <Alert color="blue" variant="light">
              <Group spacing="sm">
                <Loader size="sm" />
                <Text size="sm">Checking for experiment suggestions...</Text>
              </Group>
            </Alert>
          )}

          {/* Experiment Intervention Alert */}
          {shouldShowIntervention && !checkingIntervention && (
            <Alert color="blue" variant="light">
              <Stack spacing="sm">
                <div>
                  <Text size="sm" fw={500}>🧪 Experiment Suggestion</Text>
                  <Text size="xs" c="dimmed">
                    {experimentIntervention.suggestion_text || 'Based on similar tasks, consider adjusting your time estimate'}
                  </Text>
                </div>
                
                <Group spacing="md">
                  <Text size="sm">
                    Original: <strong>{experimentIntervention.original_estimate}m</strong>
                  </Text>
                  <Text size="sm">
                    Suggested: <strong>{experimentIntervention.suggested_estimate}m</strong>
                  </Text>
                </Group>
                
                <Button
                  size="xs"
                  variant="light"
                  onClick={handleAcceptSuggestion}
                >
                  Use Suggested Time
                </Button>
              </Stack>
            </Alert>
          )}

          {/* Accepted suggestion message */}
          {showAcceptedMessage && !checkingIntervention && (
            <Alert color="green" variant="light">
              <Text size="sm">✅ Using experiment suggestion: {form.values.plannedDuration} minutes</Text>
            </Alert>
          )}

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
              Add Task
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default AddTaskModal