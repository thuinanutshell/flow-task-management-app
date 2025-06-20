import {
    ActionIcon,
    Box,
    Button,
    Group,
    Stack,
    Text,
    UnstyledButton
} from '@mantine/core'
import {
    IconBookmark,
    IconCalendar,
    IconChartBar,
    IconClock,
    IconDashboard,
    IconLogout,
    IconMenu2,
    IconSettings,
    IconTag,
    IconX
} from '@tabler/icons-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Navigation items configuration
const navigationItems = [
  { 
    label: 'Dashboard', 
    icon: IconDashboard, 
    href: '/dashboard',
    color: 'blue'
  },
  { 
    label: 'Projects', 
    icon: IconBookmark, 
    href: '/projects',
    color: 'green'
  },
  { 
    label: 'Categories', 
    icon: IconTag, 
    href: '/categories',
    color: 'violet'
  },
  { 
    label: 'Calendar', 
    icon: IconCalendar, 
    href: '/calendar',
    color: 'orange'
  },
  { 
    label: 'Analytics', 
    icon: IconChartBar, 
    href: '/analytics',
    color: 'purple'
  },
  { 
    label: 'Experiments', 
    icon: IconClock, 
    href: '/experiments',
    color: 'teal'
  },
  { 
    label: 'Profile', 
    icon: IconSettings, 
    href: '/profile',
    color: 'gray'
  }
]

// Individual navigation item component
const NavItem = ({ item, isActive, onClick, collapsed }) => {
  const Icon = item.icon

  return (
    <UnstyledButton
      onClick={() => onClick(item.href)}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: isActive ? '#f8f9fa' : 'transparent',
        color: isActive ? '#228be6' : '#495057',
        fontWeight: isActive ? 600 : 400,
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: '#f8f9fa'
        }
      }}
    >
      <Icon size={20} style={{ minWidth: 20 }} />
      {!collapsed && (
        <Text size="sm" ml="md" style={{ whiteSpace: 'nowrap' }}>
          {item.label}
        </Text>
      )}
    </UnstyledButton>
  )
}

const Sidebar = ({ collapsed, onToggle }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const handleNavigation = (href) => {
    navigate(href)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <Box
      style={{
        width: collapsed ? 70 : 280,
        height: '100vh',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e9ecef',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100
      }}
    >
      {/* Header */}
      <Group 
        justify={collapsed ? 'center' : 'space-between'} 
        p="md"
        style={{ borderBottom: '1px solid #e9ecef', minHeight: 60 }}
      >
        {!collapsed && (
          <Text size="xl" fw={700} c="dark">
            Flow
          </Text>
        )}
        <ActionIcon
          variant="subtle"
          size="lg"
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <IconMenu2 size={20} /> : <IconX size={20} />}
        </ActionIcon>
      </Group>

      {/* Navigation Items */}
      <Stack gap="xs" p="md" style={{ flex: 1 }}>
        {navigationItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={location.pathname === item.href}
            onClick={handleNavigation}
            collapsed={collapsed}
          />
        ))}
      </Stack>

      {/* Logout Button */}
      <Box p="md" style={{ borderTop: '1px solid #e9ecef' }}>
        <Button
          variant="outline"
          color="red"
          fullWidth={!collapsed}
          size={collapsed ? 'sm' : 'md'}
          leftSection={!collapsed ? <IconLogout size={16} /> : undefined}
          onClick={handleLogout}
          styles={{
            root: {
              justifyContent: collapsed ? 'center' : 'flex-start'
            }
          }}
        >
          {collapsed ? <IconLogout size={16} /> : 'Log out'}
        </Button>
      </Box>
    </Box>
  )
}

export default Sidebar