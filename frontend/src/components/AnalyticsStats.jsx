import {
    Badge,
    Card,
    ColorSwatch,
    Grid,
    Group,
    Progress,
    RingProgress,
    Stack,
    Text,
    Title
} from '@mantine/core'
import {
    IconBulb,
    IconClock,
    IconMoodHappy,
    IconTarget
} from '@tabler/icons-react'

const AnalyticsStats = ({ categoryAnalytics = [] }) => {
  // Calculate overall stats from comprehensive category data
  const totalCategories = categoryAnalytics.length
  const overallCompletionRate = totalCategories > 0 
    ? categoryAnalytics.reduce((sum, cat) => sum + cat.completion_rate, 0) / totalCategories
    : 0

  // Aggregate estimation accuracy across all categories
  const aggregateEstimationAccuracy = () => {
    const validAccuracies = categoryAnalytics.filter(cat => 
      cat.estimation_accuracy && cat.estimation_accuracy.total_tasks_analyzed > 0
    )
    
    if (validAccuracies.length === 0) return null
    
    const totalTasks = validAccuracies.reduce((sum, cat) => 
      sum + cat.estimation_accuracy.total_tasks_analyzed, 0
    )
    const totalUnderestimated = validAccuracies.reduce((sum, cat) => 
      sum + cat.estimation_accuracy.underestimated_count, 0
    )
    const totalOverestimated = validAccuracies.reduce((sum, cat) => 
      sum + cat.estimation_accuracy.overestimated_count, 0
    )
    const totalAccurate = validAccuracies.reduce((sum, cat) => 
      sum + cat.estimation_accuracy.accurate_count, 0
    )
    
    const averageAccuracy = validAccuracies.reduce((sum, cat) => 
      sum + (cat.estimation_accuracy.accuracy_percentage * cat.estimation_accuracy.total_tasks_analyzed), 0
    ) / totalTasks
    
    return {
      accuracy_percentage: Math.round(averageAccuracy),
      total_tasks_analyzed: totalTasks,
      underestimated_count: totalUnderestimated,
      overestimated_count: totalOverestimated,
      accurate_count: totalAccurate,
      underestimated_percentage: Math.round((totalUnderestimated / totalTasks) * 100),
      overestimated_percentage: Math.round((totalOverestimated / totalTasks) * 100),
      accurate_percentage: Math.round((totalAccurate / totalTasks) * 100)
    }
  }

  // Aggregate mental state distribution across all categories
  const aggregateMentalStateDistribution = () => {
    const validDistributions = categoryAnalytics.filter(cat => 
      cat.mental_state_distribution && cat.mental_state_distribution.total_tasks > 0
    )
    
    if (validDistributions.length === 0) return null
    
    const totalTasks = validDistributions.reduce((sum, cat) => 
      sum + cat.mental_state_distribution.total_tasks, 0
    )
    
    const aggregatedCounts = {}
    validDistributions.forEach(cat => {
      Object.entries(cat.mental_state_distribution.mental_states.counts || {}).forEach(([state, count]) => {
        aggregatedCounts[state] = (aggregatedCounts[state] || 0) + count
      })
    })
    
    const aggregatedPercentages = {}
    Object.entries(aggregatedCounts).forEach(([state, count]) => {
      aggregatedPercentages[state] = Math.round((count / totalTasks) * 100)
    })
    
    // Calculate positive states percentage
    const positiveStates = ['energized', 'focused', 'satisfied', 'motivated']
    const positiveCount = positiveStates.reduce((sum, state) => 
      sum + (aggregatedCounts[state] || 0), 0
    )
    const positivePercentage = Math.round((positiveCount / totalTasks) * 100)
    
    // Find most common state
    const mostCommonState = Object.keys(aggregatedCounts).reduce((a, b) => 
      aggregatedCounts[a] > aggregatedCounts[b] ? a : b
    )
    
    return {
      total_tasks: totalTasks,
      mental_states: {
        counts: aggregatedCounts,
        percentages: aggregatedPercentages
      },
      most_common_state: mostCommonState,
      positive_states_percentage: positivePercentage
    }
  }

  const estimationAccuracy = aggregateEstimationAccuracy()
  const mentalStateDistribution = aggregateMentalStateDistribution()

  // Get top performing category
  const topCategory = categoryAnalytics.length > 0
    ? categoryAnalytics.reduce((best, current) =>
        current.completion_rate > best.completion_rate ? current : best
      )
    : null

  // Get most common mental state
  const mostCommonState = mentalStateDistribution?.most_common_state || null

  const formatPercentage = (rate) => Math.round(rate * 100)

  // Get mental state emoji
  const getMentalStateEmoji = (state) => {
    const emojiMap = {
      'energized': '⚡',
      'focused': '🎯',
      'satisfied': '😊',
      'motivated': '🚀',
      'tired': '😴',
      'frustrated': '😤',
      'anxious': '😰'
    }
    return emojiMap[state] || '😐'
  }

  return (
    <Grid>
      {/* Overall Completion Rate */}
      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <Card withBorder h="100%">
          <Stack spacing="xs" align="center">
            <IconTarget size={32} color="#228be6" />
            <div style={{ textAlign: 'center' }}>
              <Text size="xl" fw={700}>
                {formatPercentage(overallCompletionRate)}%
              </Text>
              <Text size="sm" c="dimmed">
                Overall Completion
              </Text>
            </div>
          </Stack>
        </Card>
      </Grid.Col>

      {/* Estimation Accuracy */}
      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <Card withBorder h="100%">
          <Stack spacing="xs" align="center">
            <IconBulb size={32} color="#40c057" />
            <div style={{ textAlign: 'center' }}>
              <Text size="xl" fw={700}>
                {estimationAccuracy ? `${estimationAccuracy.accuracy_percentage}%` : '-'}
              </Text>
              <Text size="sm" c="dimmed">
                Estimation Accuracy
              </Text>
            </div>
          </Stack>
        </Card>
      </Grid.Col>

      {/* Most Common Mental State */}
      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <Card withBorder h="100%">
          <Stack spacing="xs" align="center">
            <IconMoodHappy size={32} color="#fab005" />
            <div style={{ textAlign: 'center' }}>
              {mostCommonState ? (
                <>
                  <Text size="xl" fw={700}>
                    {getMentalStateEmoji(mostCommonState)}
                  </Text>
                  <Text size="sm" fw={500} tt="capitalize">
                    {mostCommonState}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Most Common State
                  </Text>
                </>
              ) : (
                <>
                  <Text size="xl" fw={700} c="dimmed">
                    -
                  </Text>
                  <Text size="sm" c="dimmed">
                    No Data
                  </Text>
                </>
              )}
            </div>
          </Stack>
        </Card>
      </Grid.Col>

      {/* Total Categories */}
      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <Card withBorder h="100%">
          <Stack spacing="xs" align="center">
            <IconClock size={32} color="#be4bdb" />
            <div style={{ textAlign: 'center' }}>
              <Text size="xl" fw={700}>
                {totalCategories}
              </Text>
              <Text size="sm" c="dimmed">
                Active Categories
              </Text>
            </div>
          </Stack>
        </Card>
      </Grid.Col>

      {/* Category Breakdown */}
      <Grid.Col span={12}>
        <Card withBorder>
          <Title order={4} mb="md">Category Performance</Title>
          
          {categoryAnalytics.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              No category data available
            </Text>
          ) : (
            <Stack spacing="md">
              {categoryAnalytics.map((category) => (
                <div key={category.id || category.category?.id}>
                  <Group justify="space-between" align="center" mb="xs">
                    <Group spacing="sm">
                      <ColorSwatch color={category.color || category.category?.color} size={20} />
                      <Text fw={500}>{category.name || category.category?.name}</Text>
                      <Badge variant="light" size="sm">
                        {category.total_tasks || 0} tasks
                      </Badge>
                    </Group>
                    <Text fw={600} size="sm">
                      {formatPercentage(category.completion_rate)}%
                    </Text>
                  </Group>
                  
                  <Progress
                    value={formatPercentage(category.completion_rate)}
                    color={category.color || category.category?.color}
                    size="md"
                    radius="sm"
                  />
                </div>
              ))}
            </Stack>
          )}
        </Card>
      </Grid.Col>

      {/* Estimation Accuracy Details */}
      {estimationAccuracy && (
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder>
            <Title order={4} mb="md">Time Estimation</Title>
            
            <Stack spacing="md">
              <Group justify="center">
                <RingProgress
                  size={150}
                  thickness={12}
                  sections={[
                    {
                      value: estimationAccuracy.accuracy_percentage,
                      color: estimationAccuracy.accuracy_percentage >= 70 ? 'green' : 
                             estimationAccuracy.accuracy_percentage >= 50 ? 'yellow' : 'red'
                    }
                  ]}
                  label={
                    <div style={{ textAlign: 'center' }}>
                      <Text size="lg" fw={700}>
                        {estimationAccuracy.accuracy_percentage}%
                      </Text>
                      <Text size="xs" c="dimmed">
                        Accurate
                      </Text>
                    </div>
                  }
                />
              </Group>
              
              <Stack spacing="xs">
                <Group justify="space-between">
                  <Text size="sm">Underestimated:</Text>
                  <Badge color="red" variant="light">
                    {estimationAccuracy.underestimated_percentage}%
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Accurate:</Text>
                  <Badge color="green" variant="light">
                    {estimationAccuracy.accurate_percentage}%
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Overestimated:</Text>
                  <Badge color="orange" variant="light">
                    {estimationAccuracy.overestimated_percentage}%
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" ta="center" mt="sm">
                  Based on {estimationAccuracy.total_tasks_analyzed} completed tasks
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Grid.Col>
      )}

      {/* Mental State Distribution */}
      {mentalStateDistribution && mentalStateDistribution.total_tasks > 0 && (
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder>
            <Title order={4} mb="md">Mental State Distribution</Title>
            
            <Stack spacing="sm">
              {Object.entries(mentalStateDistribution.mental_states.percentages || {})
                .sort((a, b) => b[1] - a[1]) // Sort by percentage desc
                .map(([state, percentage]) => (
                  <div key={state}>
                    <Group justify="space-between" align="center" mb="xs">
                      <Group spacing="sm">
                        <Text size="lg">{getMentalStateEmoji(state)}</Text>
                        <Text fw={500} tt="capitalize">{state}</Text>
                      </Group>
                      <Text fw={600} size="sm">
                        {percentage}%
                      </Text>
                    </Group>
                    
                    <Progress
                      value={percentage}
                      color={
                        ['energized', 'focused', 'satisfied', 'motivated'].includes(state) 
                          ? 'green' : 'orange'
                      }
                      size="sm"
                      radius="sm"
                    />
                  </div>
                ))}
              
              <Group justify="space-between" mt="md" p="sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <Text size="sm" fw={500}>Positive States:</Text>
                <Badge color="green" variant="light">
                  {mentalStateDistribution.positive_states_percentage}%
                </Badge>
              </Group>
              
              <Text size="xs" c="dimmed" ta="center">
                Based on {mentalStateDistribution.total_tasks} completed tasks
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
      )}

      {/* Quick Insights */}
      <Grid.Col span={12}>
        <Card withBorder>
          <Title order={4} mb="md">Quick Insights</Title>
          
          <Stack spacing="sm">
            <Text size="sm">
              📊 You have <strong>{totalCategories}</strong> active categories
            </Text>
            
            {topCategory && (
              <Text size="sm">
                🏆 <strong>{topCategory.name || topCategory.category?.name}</strong> is your top performer at{' '}
                <strong>{formatPercentage(topCategory.completion_rate)}%</strong>
              </Text>
            )}
            
            {estimationAccuracy && (
              <Text size="sm">
                ⏱️ Your time estimation accuracy is{' '}
                <strong style={{ 
                  color: estimationAccuracy.accuracy_percentage >= 70 ? '#51cf66' : 
                         estimationAccuracy.accuracy_percentage >= 50 ? '#ffd43b' : '#ff8787'
                }}>
                  {estimationAccuracy.accuracy_percentage}%
                </strong>
                {estimationAccuracy.accuracy_percentage < 70 && 
                  estimationAccuracy.underestimated_percentage > estimationAccuracy.overestimated_percentage
                  ? ' (you tend to underestimate)'
                  : estimationAccuracy.accuracy_percentage < 70 && 
                    estimationAccuracy.overestimated_percentage > estimationAccuracy.underestimated_percentage
                  ? ' (you tend to overestimate)'
                  : ''
                }
              </Text>
            )}
            
            {mostCommonState && (
              <Text size="sm">
                {getMentalStateEmoji(mostCommonState)} You most often feel{' '}
                <strong>{mostCommonState}</strong> when completing tasks
              </Text>
            )}
            
            {mentalStateDistribution && (
              <Text size="sm">
                😊 <strong>{mentalStateDistribution.positive_states_percentage}%</strong> of your 
                completed tasks had positive mental states
              </Text>
            )}
            
            <Text size="sm">
              🎯 Overall completion rate:{' '}
              <strong style={{ 
                color: overallCompletionRate >= 0.8 ? '#51cf66' : 
                       overallCompletionRate >= 0.5 ? '#ffd43b' : '#ff8787'
              }}>
                {formatPercentage(overallCompletionRate)}%
              </strong>
            </Text>
          </Stack>
        </Card>
      </Grid.Col>
    </Grid>
  )
}

export default AnalyticsStats
