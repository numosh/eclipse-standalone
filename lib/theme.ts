/**
 * Professional Theme Configuration
 * Inspired by KBE.pdf design system
 */

export const theme = {
  // Color Palette - Professional Gradients
  colors: {
    primary: {
      purple: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7e22ce',
        800: '#6b21a8',
        900: '#581c87'
      },
      blue: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a'
      },
      green: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d'
      }
    },

    // Platform Brand Colors (from KBE)
    platforms: {
      instagram: '#E4405F',
      facebook: '#4267B2',
      twitter: '#1DA1F2',
      youtube: '#FF0000',
      tiktok: '#000000',
      web: '#6366F1'
    },

    // Chart Colors (KBE Palette)
    chart: [
      '#8B5CF6', // Purple
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#EC4899', // Pink
      '#6366F1', // Indigo
      '#14B8A6', // Teal
      '#F97316', // Orange
      '#8B5CF6'  // Purple (repeat for consistency)
    ],

    // Gradient Backgrounds (KBE Style)
    gradients: {
      purpleTeal: 'from-purple-50 via-emerald-50 to-teal-50',
      blueGreen: 'from-blue-50 via-cyan-50 to-green-50',
      purpleBlue: 'from-purple-50 via-white to-blue-50',
      pinkPurple: 'from-pink-50 to-purple-100',
      orangeYellow: 'from-orange-50 to-yellow-100'
    }
  },

  // Typography
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, sans-serif',
      mono: 'SF Mono, Monaco, monospace'
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    }
  },

  // Shadows (Professional)
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },

  // Chart Styling
  chart: {
    grid: {
      stroke: '#e5e7eb',
      strokeDasharray: '3 3'
    },
    axis: {
      tick: {
        fill: '#6b7280',
        fontSize: 11
      },
      label: {
        fill: '#374151',
        fontSize: 12,
        fontWeight: 500
      }
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      padding: '8px 12px'
    }
  },

  // Component Styles
  components: {
    card: {
      border: 'border border-gray-200',
      shadow: 'shadow-sm hover:shadow-md',
      rounded: 'rounded-lg',
      padding: 'p-4'
    },
    metricCard: {
      gradient: {
        purple: 'bg-gradient-to-br from-purple-50 to-purple-100',
        blue: 'bg-gradient-to-br from-blue-50 to-blue-100',
        green: 'bg-gradient-to-br from-green-50 to-green-100',
        orange: 'bg-gradient-to-br from-orange-50 to-orange-100'
      }
    }
  }
}

// Helper function to get platform color
export const getPlatformColorFromTheme = (platform: string): string => {
  const platformLower = platform.toLowerCase()
  return theme.colors.platforms[platformLower as keyof typeof theme.colors.platforms] || theme.colors.platforms.web
}

// Helper function to get chart color by index
export const getChartColor = (index: number): string => {
  return theme.colors.chart[index % theme.colors.chart.length]
}
