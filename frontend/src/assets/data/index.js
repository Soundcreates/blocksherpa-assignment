// Data Export Entry Point
import mockUsers from './mock-users.json'
import mockActivity from './mock-activity.json'
import mockProjects from './mock-projects.json'
import mockNotifications from './mock-notifications.json'
import mockSettings from './mock-settings.json'
import mockActivityTypes from './mock-activity-types.json'
import mockMenu from './mock-menu.json'
import mockNotificationTypes from './mock-notification-types.json'
import mockThemes from './mock-themes.json'

export {
  mockUsers,
  mockActivity,
  mockProjects,
  mockNotifications,
  mockSettings,
  mockActivityTypes,
  mockMenu,
  mockNotificationTypes,
  mockThemes,
}

export const getMockData = (type) => {
  const map = {
    users: mockUsers,
    activity: mockActivity,
    projects: mockProjects,
    notifications: mockNotifications,
    settings: mockSettings,
    activityTypes: mockActivityTypes,
    menu: mockMenu,
    notificationTypes: mockNotificationTypes,
    themes: mockThemes,
  }
  return map[type] || null
}

export default {
  users: mockUsers,
  activity: mockActivity,
  projects: mockProjects,
  notifications: mockNotifications,
  settings: mockSettings,
  activityTypes: mockActivityTypes,
  menu: mockMenu,
  notificationTypes: mockNotificationTypes,
  themes: mockThemes,
  getMockData,
}