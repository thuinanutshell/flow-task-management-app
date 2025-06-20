import { createTheme } from '@mantine/core'

export const theme = createTheme({
  // Increase default font sizes across all components
  fontSizes: {
    xs: '14px',    // Default: 12px
    sm: '16px',    // Default: 14px  
    md: '18px',    // Default: 16px
    lg: '20px',    // Default: 18px
    xl: '24px',    // Default: 20px
  },

  // Increase heading font sizes
  headings: {
    fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
    sizes: {
      h1: { fontSize: '36px', lineHeight: '1.2' },  // Default: 34px
      h2: { fontSize: '30px', lineHeight: '1.25' }, // Default: 26px
      h3: { fontSize: '26px', lineHeight: '1.3' },  // Default: 22px
      h4: { fontSize: '22px', lineHeight: '1.35' }, // Default: 18px
      h5: { fontSize: '18px', lineHeight: '1.4' },  // Default: 16px
      h6: { fontSize: '16px', lineHeight: '1.45' }, // Default: 14px
    },
  },

  // Increase default line height for better readability
  lineHeights: {
    xs: 1.4,
    sm: 1.45,
    md: 1.5,
    lg: 1.55,
    xl: 1.6,
  },

  // Component-specific overrides for better font sizes
  components: {
    Button: {
      defaultProps: {
        size: 'md', // Use medium size by default instead of small
      },
      styles: {
        root: {
          fontSize: '16px', // Ensure buttons have larger text
        },
      },
    },

    Text: {
      defaultProps: {
        size: 'md', // Use medium size by default
      },
    },

    Title: {
      defaultProps: {
        order: 2, // Default to h2 instead of h1 for better hierarchy
      },
    },

    Badge: {
      styles: {
        root: {
          fontSize: '13px', // Slightly larger than default
        },
      },
    },

    Menu: {
      styles: {
        item: {
          fontSize: '15px', // Larger menu items
        },
      },
    },

    Modal: {
      styles: {
        title: {
          fontSize: '20px', // Larger modal titles
        },
      },
    },

    Paper: {
      defaultProps: {
        p: 'md', // Default to medium padding
      },
    },

    Stack: {
      defaultProps: {
        gap: 'md', // Default to medium gap
      },
    },

    Group: {
      defaultProps: {
        gap: 'md', // Default to medium gap
      },
    },

    TextInput: {
      styles: {
        input: {
          fontSize: '16px', // Larger input text
        },
        label: {
          fontSize: '15px', // Larger labels
        },
      },
    },

    PasswordInput: {
      styles: {
        input: {
          fontSize: '16px', // Larger input text
        },
        label: {
          fontSize: '15px', // Larger labels
        },
      },
    },

    Select: {
      styles: {
        input: {
          fontSize: '16px', // Larger input text
        },
        label: {
          fontSize: '15px', // Larger labels
        },
        item: {
          fontSize: '15px', // Larger dropdown items
        },
      },
    },

    NumberInput: {
      styles: {
        input: {
          fontSize: '16px', // Larger input text
        },
        label: {
          fontSize: '15px', // Larger labels
        },
      },
    },

    Textarea: {
      styles: {
        input: {
          fontSize: '16px', // Larger textarea text
        },
        label: {
          fontSize: '15px', // Larger labels
        },
      },
    },

    Notification: {
      styles: {
        root: {
          fontSize: '15px', // Larger notification text
        },
      },
    },

    Alert: {
      styles: {
        message: {
          fontSize: '15px', // Larger alert text
        },
      },
    },

    Table: {
      styles: {
        td: {
          fontSize: '15px', // Larger table cell text
        },
        th: {
          fontSize: '15px', // Larger table header text
        },
      },
    },

    Tabs: {
      styles: {
        tab: {
          fontSize: '15px', // Larger tab text
        },
      },
    },

    Card: {
      defaultProps: {
        p: 'md', // Default to medium padding
      },
    },

    Container: {
      defaultProps: {
        size: 'lg', // Default to large container
      },
    },
  },

  // Increase default spacing
  spacing: {
    xs: '12px',  // Default: 10px
    sm: '16px',  // Default: 12px
    md: '20px',  // Default: 16px
    lg: '24px',  // Default: 20px
    xl: '32px',  // Default: 24px
  },

  // Increase default radius for a more modern look
  radius: {
    xs: '4px',   // Default: 2px
    sm: '6px',   // Default: 4px
    md: '10px',  // Default: 8px
    lg: '14px',  // Default: 12px
    xl: '18px',  // Default: 16px
  },
})
