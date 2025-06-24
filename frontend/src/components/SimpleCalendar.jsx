import {
    ActionIcon,
    Box,
    Grid,
    Group,
    Paper,
    Text,
    Title,
    Tooltip
} from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { analyticsService } from '../services/analytics';

// Mock data generator function
const generateMockData = (year, month) => {
  const mockData = {};
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // Generate random completion rates for each day in the month
  for (let day = 1; day <= daysInMonth; day++) {
    // Skip some days to simulate days with no data
    if (Math.random() > 0.8) continue;
    
    const date = new Date(year, month - 1, day);
    // Don't generate data for future dates
    if (date > new Date()) continue;
    
    const dateKey = date.toISOString().split('T')[0];
    // Generate random completion rate between 0 and 1
    mockData[dateKey] = Math.random();
  }
  
  return mockData;
};

const SimpleCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [completionRates, setCompletionRates] = useState({})
  const [loading, setLoading] = useState(false)
  const [useMockData, setUseMockData] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Load completion rates for the current month
  useEffect(() => {
    loadMonthData(year, month + 1) // API expects 1-based month
  }, [year, month])

  const loadMonthData = async (year, month) => {
    try {
      setLoading(true)
      const response = await analyticsService.getMonthlyCompletionRates(year, month)
      
      // If we got data from the API, use it
      if (response.data && Object.keys(response.data).length > 0) {
        setCompletionRates(response.data)
        setUseMockData(false)
      } else {
        // If no data, use mock data
        setCompletionRates(generateMockData(year, month))
        setUseMockData(true)
      }
    } catch (error) {
      console.error('Failed to load completion rates:', error)
      // On error, use mock data
      setCompletionRates(generateMockData(year, month))
      setUseMockData(true)
    } finally {
      setLoading(false)
    }
  }

  // Get completion rate for a specific date
  const getCompletionRate = (date) => {
    const dateKey = date.toISOString().split('T')[0]
    return completionRates[dateKey] || 0
  }

  // Get color based on completion rate
  const getCompletionColor = (rate) => {
    if (rate === 0) return '#f8f9fa' // Gray for no data
    if (rate >= 0.8) return '#51cf66' // Green for 80-100%
    if (rate >= 0.5) return '#ffd43b' // Yellow for 50-79%
    return '#ff8787' // Red for 0-49%
  }

  // Get text color for contrast
  const getTextColor = (rate) => {
    if (rate === 0) return '#868e96'
    return rate >= 0.5 ? '#000' : '#fff'
  }

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  // Get all days in the current month
  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const days = getDaysInMonth()
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <Paper p="md" withBorder>
      <Box>
        {/* Header */}
        <Group justify="space-between" align="center" mb="md">
          <ActionIcon 
            variant="subtle" 
            onClick={goToPreviousMonth}
            disabled={loading}
          >
            <IconChevronLeft size={16} />
          </ActionIcon>
          
          <Title order={3} size="lg">
            {monthName}
          </Title>
          
          <ActionIcon 
            variant="subtle" 
            onClick={goToNextMonth}
            disabled={loading}
          >
            <IconChevronRight size={16} />
          </ActionIcon>
        </Group>

        {/* Weekday headers */}
        <Grid gutter="xs" mb="xs">
          {weekDays.map((day) => (
            <Grid.Col key={day} span={12/7} style={{ minHeight: '30px' }}>
              <Text 
                ta="center" 
                fw={500} 
                size="sm" 
                c="dimmed"
              >
                {day}
              </Text>
            </Grid.Col>
          ))}
        </Grid>

        {/* Calendar days */}
        <Grid gutter="xs">
          {days.map((date, index) => {
            if (!date) {
              // Empty cell for padding
              return (
                <Grid.Col key={`empty-${index}`} span={12/7} style={{ minHeight: '50px' }}>
                  <Box />
                </Grid.Col>
              )
            }

            const completionRate = getCompletionRate(date)
            const isToday = date.toDateString() === new Date().toDateString()
            const isFuture = date > new Date()

            return (
              <Grid.Col key={date.toISOString()} span={12/7} style={{ minHeight: '50px' }}>
                <Tooltip
                  label={
                    isFuture 
                      ? 'Future date' 
                      : completionRate === 0 
                        ? 'No tasks completed' 
                        : `${Math.round(completionRate * 100)}% completion rate`
                  }
                  position="top"
                  withArrow
                >
                  <Paper
                    p="xs"
                    style={{
                      backgroundColor: isFuture ? '#f8f9fa' : getCompletionColor(completionRate),
                      border: isToday ? '2px solid #228be6' : '1px solid #dee2e6',
                      cursor: isFuture ? 'default' : 'pointer',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      opacity: isFuture ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Text
                      size="sm"
                      fw={isToday ? 700 : 500}
                      style={{ 
                        color: isFuture ? '#868e96' : getTextColor(completionRate),
                        lineHeight: 1
                      }}
                    >
                      {date.getDate()}
                    </Text>
                  </Paper>
                </Tooltip>
              </Grid.Col>
            )
          })}
        </Grid>

        {/* Legend */}
        <Group justify="center" mt="md" spacing="md">
          <Group spacing="xs" align="center">
            <Box
              w={12}
              h={12}
              style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '2px'
              }}
            />
            <Text size="xs" c="dimmed">No data</Text>
          </Group>
          
          <Group spacing="xs" align="center">
            <Box
              w={12}
              h={12}
              style={{
                backgroundColor: '#ff8787',
                borderRadius: '2px'
              }}
            />
            <Text size="xs" c="dimmed">0-49%</Text>
          </Group>
          
          <Group spacing="xs" align="center">
            <Box
              w={12}
              h={12}
              style={{
                backgroundColor: '#ffd43b',
                borderRadius: '2px'
              }}
            />
            <Text size="xs" c="dimmed">50-79%</Text>
          </Group>
          
          <Group spacing="xs" align="center">
            <Box
              w={12}
              h={12}
              style={{
                backgroundColor: '#51cf66',
                borderRadius: '2px'
              }}
            />
            <Text size="xs" c="dimmed">80-100%</Text>
          </Group>
        </Group>

        {loading && (
          <Text ta="center" c="dimmed" size="sm" mt="md">
            Loading completion rates...
          </Text>
        )}
        
        {useMockData && !loading && (
          <Text ta="center" c="dimmed" size="xs" mt="md">
            Using sample data for demonstration
          </Text>
        )}
      </Box>
    </Paper>
  )
}

export default SimpleCalendar
