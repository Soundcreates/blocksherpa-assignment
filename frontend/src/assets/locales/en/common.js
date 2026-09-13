// ============================================================
// ENGLISH LOCALIZATION MODULE
// ============================================================

// ──────────────────────────────────────────────────────────────
// TRANSLATION HELPERS
// ──────────────────────────────────────────────────────────────

/**
 * Interpolate values into a translation string
 * @param {string} str - The translation string with {placeholders}
 * @param {Object} params - Key-value pairs for interpolation
 * @returns {string} The interpolated string
 */
function interpolate(str, params = {}) {
  return str.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? params[key] : `{${key}}`
  })
}

/**
 * Pluralize a translation based on count
 * @param {Object} options - Contains singular, plural, and count
 * @param {string} options.singular - Singular form
 * @param {string} options.plural - Plural form
 * @param {number} options.count - The count to check
 * @returns {string} The correct pluralized form
 */
function pluralize({ singular, plural, count }) {
  return count === 1 ? singular : plural
}

/**
 * Get a nested value from an object using dot notation
 * @param {Object} obj - The object to traverse
 * @param {string} path - Dot-separated path (e.g., 'app.name')
 * @returns {any} The value at the path, or undefined
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

/**
 * Creates a translation function for a specific locale
 * @param {Object} translations - The translations object
 * @returns {Function} A translation function
 */
function createTranslator(translations) {
  return function t(key, params = {}) {
    const value = getNestedValue(translations, key)
    if (typeof value === 'string') {
      return interpolate(value, params)
    }
    return key // Fallback to the key itself
  }
}

// ──────────────────────────────────────────────────────────────
// ENGLISH TRANSLATIONS
// ──────────────────────────────────────────────────────────────

const translations = {
  // Application
  app: {
    name: 'Admin Panel',
    version: '2.3.0',
    description: 'Administrative dashboard for the platform',
    copyright: '© 2026 REChain. All rights reserved.',
    slogan: 'Manage your business, your way',
  },

  // Navigation
  navigation: {
    dashboard: 'Dashboard',
    users: 'Users',
    projects: 'Projects',
    analytics: 'Analytics',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    admin: 'Admin',
    support: 'Support',
    help: 'Help',
    documentation: 'Documentation',
    community: 'Community',
    changelog: 'Changelog',
    roadmap: 'Roadmap',
  },

  // Actions
  actions: {
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    export: 'Export',
    import: 'Import',
    search: 'Search',
    filter: 'Filter',
    refresh: 'Refresh',
    download: 'Download',
    upload: 'Upload',
    share: 'Share',
    print: 'Print',
    copy: 'Copy',
    paste: 'Paste',
    undo: 'Undo',
    redo: 'Redo',
    close: 'Close',
    open: 'Open',
    view: 'View',
    hide: 'Hide',
    show: 'Show',
    add: 'Add',
    remove: 'Remove',
    update: 'Update',
    submit: 'Submit',
    reset: 'Reset',
    clear: 'Clear',
    done: 'Done',
    next: 'Next',
    previous: 'Previous',
    first: 'First',
    last: 'Last',
    back: 'Back',
    forward: 'Forward',
    start: 'Start',
    stop: 'Stop',
    pause: 'Pause',
    resume: 'Resume',
    retry: 'Retry',
    skip: 'Skip',
    finish: 'Finish',
    approve: 'Approve',
    reject: 'Reject',
    publish: 'Publish',
    unpublish: 'Unpublish',
    archive: 'Archive',
    restore: 'Restore',
  },

  // Status
  status: {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    'in-progress': 'In Progress',
    'in-review': 'In Review',
    planning: 'Planning',
    completed: 'Completed',
    cancelled: 'Cancelled',
    approved: 'Approved',
    rejected: 'Rejected',
    published: 'Published',
    draft: 'Draft',
    archived: 'Archived',
    deleted: 'Deleted',
    locked: 'Locked',
    unlocked: 'Unlocked',
    private: 'Private',
    public: 'Public',
    internal: 'Internal',
    external: 'External',
    online: 'Online',
    offline: 'Offline',
    away: 'Away',
    busy: 'Busy',
    doNotDisturb: 'Do Not Disturb',
  },

  // Errors
  errors: {
    generic: 'Something went wrong. Please try again.',
    notFound: 'Page not found.',
    unauthorized: 'You do not have permission to view this page.',
    networkError: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    validation: 'Please check your input and try again.',
    required: 'This field is required.',
    email: 'Please enter a valid email address.',
    password: 'Please enter a valid password.',
    confirmPassword: 'Passwords do not match.',
    minLength: 'Must be at least {min} characters.',
    maxLength: 'Must be at most {max} characters.',
    minValue: 'Must be at least {min}.',
    maxValue: 'Must be at most {max}.',
    fileSize: 'File is too large. Maximum size is {size}MB.',
    fileType: 'File type not supported.',
    notFoundItem: 'The requested item could not be found.',
    alreadyExists: 'This item already exists.',
    expired: 'This session has expired. Please log in again.',
    forbidden: 'You do not have permission to perform this action.',
    rateLimit: 'Too many requests. Please try again later.',
  },

  // Messages
  messages: {
    welcome: 'Welcome back, {name}!',
    confirmDelete: 'Are you sure you want to delete this item?',
    confirmDeleteMultiple: 'Are you sure you want to delete {count} items?',
    successSave: 'Changes saved successfully.',
    successDelete: 'Item deleted successfully.',
    successDeleteMultiple: '{count} items deleted successfully.',
    successCreate: 'Item created successfully.',
    successUpdate: 'Item updated successfully.',
    successUpload: 'File uploaded successfully.',
    successImport: 'Data imported successfully.',
    successExport: 'Data exported successfully.',
    successCopy: 'Copied to clipboard.',
    noChanges: 'No changes were made.',
    loading: 'Loading...',
    saving: 'Saving...',
    deleting: 'Deleting...',
    processing: 'Processing...',
    waiting: 'Please wait...',
    noData: 'No data available.',
    noResults: 'No results found.',
    noItems: 'No items found.',
    emptyState: 'Nothing here yet. Start by creating your first item.',
    welcomeBack: 'Welcome back! You have {count} new notifications.',
    newVersion: 'A new version is available. Please refresh the page.',
    offlineMode: 'You are offline. Some features may be unavailable.',
    onlineMode: 'You are back online.',
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    totalUsers: 'Total Users',
    activeUsers: 'Active Users',
    newUsers: 'New Users',
    activeProjects: 'Active Projects',
    completedProjects: 'Completed Projects',
    totalProjects: 'Total Projects',
    revenue: 'Revenue',
    expenses: 'Expenses',
    profit: 'Profit',
    totalRevenue: 'Total Revenue',
    monthlyRevenue: 'Monthly Revenue',
    yearlyRevenue: 'Yearly Revenue',
    recentActivity: 'Recent Activity',
    viewAll: 'View All',
    noActivity: 'No recent activity',
    lastUpdated: 'Last updated: {time}',
    analytics: 'Analytics',
    reports: 'Reports',
    insights: 'Insights',
    trends: 'Trends',
    overview: 'Overview',
    stats: 'Statistics',
    performance: 'Performance',
    growth: 'Growth',
    conversion: 'Conversion',
    retention: 'Retention',
    engagement: 'Engagement',
    satisfaction: 'Satisfaction',
    goals: 'Goals',
    achievements: 'Achievements',
    milestones: 'Milestones',
  },

  // Users
  users: {
    title: 'User Management',
    list: 'User List',
    addUser: 'Add User',
    editUser: 'Edit User',
    deleteUser: 'Delete User',
    deleteUsers: 'Delete Users',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    status: 'Status',
    createdAt: 'Created At',
    updatedAt: 'Updated At',
    lastLogin: 'Last Login',
    actions: 'Actions',
    confirmDelete: 'Are you sure you want to delete this user?',
    confirmDeleteMultiple: 'Are you sure you want to delete {count} users?',
    successCreate: 'User created successfully.',
    successUpdate: 'User updated successfully.',
    successDelete: 'User deleted successfully.',
    successDeleteMultiple: '{count} users deleted successfully.',
    noUsers: 'No users found.',
    searchPlaceholder: 'Search users...',
    filterPlaceholder: 'Filter by role...',
    roles: {
      admin: 'Administrator',
      editor: 'Editor',
      viewer: 'Viewer',
      contributor: 'Contributor',
      manager: 'Manager',
      developer: 'Developer',
      designer: 'Designer',
      moderator: 'Moderator',
      support: 'Support Agent',
    },
    fields: {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email Address',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      role: 'Role',
      status: 'Status',
      phone: 'Phone Number',
      address: 'Address',
      city: 'City',
      state: 'State',
      zipCode: 'Zip Code',
      country: 'Country',
      bio: 'Bio',
      avatar: 'Avatar',
    },
    validation: {
      nameRequired: 'Name is required',
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email',
      passwordRequired: 'Password is required',
      passwordMinLength: 'Password must be at least 8 characters',
      passwordMatch: 'Passwords do not match',
      roleRequired: 'Role is required',
    },
  },

  // Projects
  projects: {
    title: 'Project Management',
    list: 'Project List',
    addProject: 'Add Project',
    editProject: 'Edit Project',
    deleteProject: 'Delete Project',
    deleteProjects: 'Delete Projects',
    name: 'Project Name',
    description: 'Description',
    status: 'Status',
    progress: 'Progress',
    team: 'Team',
    dueDate: 'Due Date',
    priority: 'Priority',
    budget: 'Budget',
    spent: 'Spent',
    remaining: 'Remaining',
    createdAt: 'Created At',
    updatedAt: 'Updated At',
    actions: 'Actions',
    confirmDelete: 'Are you sure you want to delete this project?',
    confirmDeleteMultiple: 'Are you sure you want to delete {count} projects?',
    successCreate: 'Project created successfully.',
    successUpdate: 'Project updated successfully.',
    successDelete: 'Project deleted successfully.',
    successDeleteMultiple: '{count} projects deleted successfully.',
    noProjects: 'No projects found.',
    searchPlaceholder: 'Search projects...',
    filterPlaceholder: 'Filter by status...',
    priorities: {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      none: 'None',
    },
    statuses: {
      planning: 'Planning',
      'in-progress': 'In Progress',
      'in-review': 'In Review',
      completed: 'Completed',
      cancelled: 'Cancelled',
      onHold: 'On Hold',
    },
    fields: {
      name: 'Project Name',
      description: 'Description',
      status: 'Status',
      priority: 'Priority',
      dueDate: 'Due Date',
      budget: 'Budget',
      team: 'Team Members',
      tags: 'Tags',
      category: 'Category',
      attachments: 'Attachments',
    },
  },

  // Settings
 // ──────────────────────────────────────────────────────────────
// Settings
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// Settings
// ──────────────────────────────────────────────────────────────

settings: {
  general: 'General Settings',
  language: 'Language',
  theme: 'Theme',
  saveChanges: 'Save Changes',
  resetToDefault: 'Reset to Default',
  cancel: 'Cancel Changes',
  confirmReset: 'Are you sure you want to reset all settings to default?',
  successUpdate: 'Settings updated successfully.',
  themes: {
    dark: 'Dark',
    light: 'Light',
    ocean: 'Ocean',
    sunset: 'Sunset',
    forest: 'Forest',
  },
  languages: {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    zh: '中文',
    ja: '日本語',
    pt: 'Português',
    it: 'Italiano',
    ru: 'Русский',
  },
  notifications: {
    email: 'Email Notifications',
    push: 'Push Notifications',
    sms: 'SMS Notifications',
    inApp: 'In-App Notifications',
    marketing: 'Marketing Communications',
    updates: 'Product Updates',
    security: 'Security Alerts',
    account: 'Account Activity',
  },
  security: {
    twoFactorAuth: 'Two-Factor Authentication',
    sessionTimeout: 'Session Timeout (minutes)',
    maxLoginAttempts: 'Maximum Login Attempts',
    passwordPolicy: 'Password Policy',
    requireSpecialChar: 'Require Special Character',
    requireNumber: 'Require Number',
    requireUppercase: 'Require Uppercase Letter',
    requireLowercase: 'Require Lowercase Letter',
    minLength: 'Minimum Length',
    passwordExpiry: 'Password Expiry (days)',
  },
  appearance: {
    sidebarCollapsed: 'Collapse Sidebar',
    compactView: 'Compact View',
    animations: 'Enable Animations',
    fontSize: 'Font Size',
    fontSizes: {
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
    },
    colorScheme: 'Color Scheme',
  },
},

  // Additional sections
  auth: {
    login: {
      title: 'Sign In',
      email: 'Email Address',
      password: 'Password',
      rememberMe: 'Remember Me',
      forgotPassword: 'Forgot Password?',
      signIn: 'Sign In',
      noAccount: "Don't have an account?",
      signUp: 'Sign Up',
      error: 'Invalid email or password',
      success: 'Signed in successfully',
    },
    register: {
      title: 'Create Account',
      name: 'Full Name',
      email: 'Email Address',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      agreeTerms: 'I agree to the Terms of Service',
      signUp: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      signIn: 'Sign In',
      error: 'Registration failed. Please try again.',
      success: 'Account created successfully',
    },
    resetPassword: {
      title: 'Reset Password',
      email: 'Email Address',
      submit: 'Send Reset Link',
      backToLogin: 'Back to Sign In',
      error: 'Email not found',
      success: 'Reset link sent to your email',
    },
  },

  // Time and date
  time: {
    now: 'Now',
    seconds: 'seconds',
    minutes: 'minutes',
    hours: 'hours',
    days: 'days',
    weeks: 'weeks',
    months: 'months',
    years: 'years',
    justNow: 'Just now',
    minuteAgo: 'A minute ago',
    minutesAgo: '{count} minutes ago',
    hourAgo: 'An hour ago',
    hoursAgo: '{count} hours ago',
    dayAgo: 'A day ago',
    daysAgo: '{count} days ago',
    weekAgo: 'A week ago',
    weeksAgo: '{count} weeks ago',
    monthAgo: 'A month ago',
    monthsAgo: '{count} months ago',
    yearAgo: 'A year ago',
    yearsAgo: '{count} years ago',
  },

  // Pagination
  pagination: {
    showing: 'Showing',
    of: 'of',
    items: 'items',
    page: 'Page',
    previous: 'Previous',
    next: 'Next',
    first: 'First',
    last: 'Last',
    rowsPerPage: 'Rows per page:',
  },

  // File upload
  upload: {
    dragAndDrop: 'Drag and drop files here, or click to browse',
    maxSize: 'Maximum file size: {size}MB',
    acceptedTypes: 'Accepted file types: {types}',
    uploading: 'Uploading...',
    uploadComplete: 'Upload complete',
    uploadFailed: 'Upload failed',
    removeFile: 'Remove file',
    fileTooLarge: 'File too large',
    fileTypeNotSupported: 'File type not supported',
    maxFilesExceeded: 'Maximum number of files exceeded',
  },
}

// ──────────────────────────────────────────────────────────────
// EXPORTS
// ──────────────────────────────────────────────────────────────

export const t = createTranslator(translations)
export { translations as default }

// Helper exports
export { interpolate, pluralize, getNestedValue, createTranslator }