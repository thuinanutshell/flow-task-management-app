import {
  Alert,
  Button,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconAlertCircle, IconCalendar, IconRefresh } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import AnalyticsStats from '../components/AnalyticsStats'
import { analyticsService } from '../services/analytics'

const Analytics = () => {
  const [categoryAnalytics, setCategoryAnalytics] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState([null, null])

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Prepare date range for API call
      const apiDateRange = dateRange[0] instanceof Date && dateRange[1] instanceof Date ? {
        start_date: dateRange[0].toISOString().split('T')[0],
        end_date: dateRange[1].toISOString().split('T')[0]
      } : null

      // Get comprehensive analytics for all categories
      const response = await analyticsService.getAllCategoriesAnalytics(apiDateRange)
      setCategoryAnalytics(response.data?.categories || [])
    } catch (err) {
      setError(err.message || 'Failed to load analytics')
      setCategoryAnalytics([])
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  // Load analytics data
  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const handleRefresh = () => {
    loadAnalytics()
  }

  const handleClearDateRange = () => {
    setDateRange([null, null])
  }

  // Get current period description
  const getPeriodDescription = () => {
    if (dateRange[0] && dateRange[1]) {
      // Make sure we're working with Date objects
      const start = dateRange[0] instanceof Date ? dateRange[0].toLocaleDateString() : 'Invalid date';
      const end = dateRange[1] instanceof Date ? dateRange[1].toLocaleDateString() : 'Invalid date';
      return `${start} - ${end}`;
    }
    return 'All time';
  }

  return (
    <Container size="xl">
      <Stack spacing="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1}>Analytics</Title>
            <Text c="dimmed" size="lg" mt="xs">
              Track your productivity insights and patterns
            </Text>
          </div>
          
          <Group spacing="sm">
            <Button
              leftSection={<IconRefresh size={16} />}
              variant="outline"
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
          </Group>
        </Group>

        {/* Date Range Filter */}
        <Group justify="flex-end" align="center">
          <Group spacing="sm">
            <DatePickerInput
              type="range"
              placeholder="Select date range"
              value={dateRange}
              onChange={setDateRange}
              leftSection={<IconCalendar size={16} />}
              clearable
              maxDate={new Date()}
            />
            {(dateRange[0] || dateRange[1]) && (
              <Button
                variant="subtle"
                size="sm"
                onClick={handleClearDateRange}
              >
                Clear
              </Button>
            )}
          </Group>
        </Group>

        {/* Error Display */}
        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Group justify="center" py="xl">
            <Loader size="lg" />
            <Text>Loading analytics...</Text>
          </Group>
        )}

        {/* Main Content */}
        {!loading && (
          <AnalyticsStats categoryAnalytics={categoryAnalytics} />
        )}
      </Stack>
    </Container>
  )
}

export default Analytics
