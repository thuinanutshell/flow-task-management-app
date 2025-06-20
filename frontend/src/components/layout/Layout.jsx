import { Box } from '@mantine/core'
import { useState } from 'react'
import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <Box style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={toggleSidebar} 
      />
      
      {/* Main Content */}
      <Box
        style={{
          marginLeft: sidebarCollapsed ? 70 : 280,
          flex: 1,
          transition: 'margin-left 0.3s ease',
          backgroundColor: '#f8f9fa',
          minHeight: '100vh'
        }}
      >
        <Box p="xl">
          {children}
        </Box>
      </Box>
    </Box>
  )
}

export default Layout