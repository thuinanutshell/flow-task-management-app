import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { TimerProvider } from './context/TimerContext'

import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider>
      <Notifications />
      <TimerProvider>
        <App />
      </TimerProvider>
    </MantineProvider>
  </React.StrictMode>,
)