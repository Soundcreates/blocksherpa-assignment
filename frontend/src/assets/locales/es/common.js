// ============================================================
// SPANISH LOCALIZATION MODULE
// ============================================================

// ──────────────────────────────────────────────────────────────
// TRANSLATION HELPERS
// ──────────────────────────────────────────────────────────────

/**
 * Interpolar valores en una cadena de traducción
 * @param {string} str - La cadena con {marcadores}
 * @param {Object} params - Pares clave-valor para interpolación
 * @returns {string} La cadena interpolada
 */
function interpolate(str, params = {}) {
  return str.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? params[key] : `{${key}}`
  })
}

/**
 * Pluralizar una traducción basada en el conteo
 * @param {Object} options - Contiene singular, plural y conteo
 * @param {string} options.singular - Forma singular
 * @param {string} options.plural - Forma plural
 * @param {number} options.count - El conteo para verificar
 * @returns {string} La forma pluralizada correcta
 */
function pluralize({ singular, plural, count }) {
  return count === 1 ? singular : plural
}

/**
 * Obtener un valor anidado de un objeto usando notación de puntos
 * @param {Object} obj - El objeto a recorrer
 * @param {string} path - Ruta separada por puntos (ej. 'app.name')
 * @returns {any} El valor en la ruta, o undefined
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

/**
 * Crea una función de traducción para un locale específico
 * @param {Object} translations - El objeto de traducciones
 * @returns {Function} Una función de traducción
 */
function createTranslator(translations) {
  return function t(key, params = {}) {
    const value = getNestedValue(translations, key)
    if (typeof value === 'string') {
      return interpolate(value, params)
    }
    return key
  }
}

// ──────────────────────────────────────────────────────────────
// SPANISH TRANSLATIONS
// ──────────────────────────────────────────────────────────────

const translations = {
  // Aplicación
  app: {
    name: 'Panel de Administración',
    version: '2.3.0',
    description: 'Panel administrativo para la plataforma',
    copyright: '© 2026 REChain. Todos los derechos reservados.',
    slogan: 'Gestiona tu negocio, a tu manera',
  },

  // Navegación
  navigation: {
    dashboard: 'Panel',
    users: 'Usuarios',
    projects: 'Proyectos',
    analytics: 'Analíticas',
    settings: 'Configuración',
    profile: 'Perfil',
    logout: 'Cerrar Sesión',
    admin: 'Administración',
    support: 'Soporte',
    help: 'Ayuda',
    documentation: 'Documentación',
    community: 'Comunidad',
    changelog: 'Registro de Cambios',
    roadmap: 'Hoja de Ruta',
  },

  // Acciones
  actions: {
    create: 'Crear',
    edit: 'Editar',
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    export: 'Exportar',
    import: 'Importar',
    search: 'Buscar',
    filter: 'Filtrar',
    refresh: 'Actualizar',
    download: 'Descargar',
    upload: 'Subir',
    share: 'Compartir',
    print: 'Imprimir',
    copy: 'Copiar',
    paste: 'Pegar',
    undo: 'Deshacer',
    redo: 'Rehacer',
    close: 'Cerrar',
    open: 'Abrir',
    view: 'Ver',
    hide: 'Ocultar',
    show: 'Mostrar',
    add: 'Agregar',
    remove: 'Eliminar',
    update: 'Actualizar',
    submit: 'Enviar',
    reset: 'Restablecer',
    clear: 'Limpiar',
    done: 'Hecho',
    next: 'Siguiente',
    previous: 'Anterior',
    first: 'Primero',
    last: 'Último',
    back: 'Atrás',
    forward: 'Adelante',
    start: 'Comenzar',
    stop: 'Detener',
    pause: 'Pausar',
    resume: 'Reanudar',
    retry: 'Reintentar',
    skip: 'Saltar',
    finish: 'Finalizar',
    approve: 'Aprobar',
    reject: 'Rechazar',
    publish: 'Publicar',
    unpublish: 'Despublicar',
    archive: 'Archivar',
    restore: 'Restaurar',
  },

  // Estado
  status: {
    active: 'Activo',
    inactive: 'Inactivo',
    pending: 'Pendiente',
    'in-progress': 'En Progreso',
    'in-review': 'En Revisión',
    planning: 'Planificando',
    completed: 'Completado',
    cancelled: 'Cancelado',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    published: 'Publicado',
    draft: 'Borrador',
    archived: 'Archivado',
    deleted: 'Eliminado',
    locked: 'Bloqueado',
    unlocked: 'Desbloqueado',
    private: 'Privado',
    public: 'Público',
    internal: 'Interno',
    external: 'Externo',
    online: 'En línea',
    offline: 'Desconectado',
    away: 'Ausente',
    busy: 'Ocupado',
    doNotDisturb: 'No Molestar',
  },

  // Errores
  errors: {
    generic: 'Algo salió mal. Por favor, intente de nuevo.',
    notFound: 'Página no encontrada.',
    unauthorized: 'No tienes permiso para ver esta página.',
    networkError: 'Error de red. Por favor, verifica tu conexión.',
    serverError: 'Error del servidor. Por favor, intente más tarde.',
    validation: 'Por favor, revisa tu entrada e inténtalo de nuevo.',
    required: 'Este campo es obligatorio.',
    email: 'Por favor, introduce un correo electrónico válido.',
    password: 'Por favor, introduce una contraseña válida.',
    confirmPassword: 'Las contraseñas no coinciden.',
    minLength: 'Debe tener al menos {min} caracteres.',
    maxLength: 'Debe tener como máximo {max} caracteres.',
    minValue: 'Debe ser al menos {min}.',
    maxValue: 'Debe ser como máximo {max}.',
    fileSize: 'El archivo es demasiado grande. El tamaño máximo es {size}MB.',
    fileType: 'Tipo de archivo no soportado.',
    notFoundItem: 'El elemento solicitado no pudo ser encontrado.',
    alreadyExists: 'Este elemento ya existe.',
    expired: 'La sesión ha expirado. Por favor, inicia sesión de nuevo.',
    forbidden: 'No tienes permiso para realizar esta acción.',
    rateLimit: 'Demasiadas solicitudes. Por favor, intente más tarde.',
  },

  // Mensajes
  messages: {
    welcome: '¡Bienvenido de nuevo, {name}!',
    confirmDelete: '¿Estás seguro de que deseas eliminar este elemento?',
    confirmDeleteMultiple: '¿Estás seguro de que deseas eliminar {count} elementos?',
    successSave: 'Cambios guardados correctamente.',
    successDelete: 'Elemento eliminado correctamente.',
    successDeleteMultiple: '{count} elementos eliminados correctamente.',
    successCreate: 'Elemento creado correctamente.',
    successUpdate: 'Elemento actualizado correctamente.',
    successUpload: 'Archivo subido correctamente.',
    successImport: 'Datos importados correctamente.',
    successExport: 'Datos exportados correctamente.',
    successCopy: 'Copiado al portapapeles.',
    noChanges: 'No se realizaron cambios.',
    loading: 'Cargando...',
    saving: 'Guardando...',
    deleting: 'Eliminando...',
    processing: 'Procesando...',
    waiting: 'Por favor, espera...',
    noData: 'No hay datos disponibles.',
    noResults: 'No se encontraron resultados.',
    noItems: 'No se encontraron elementos.',
    emptyState: 'No hay nada aquí aún. Comienza creando tu primer elemento.',
    welcomeBack: '¡Bienvenido de nuevo! Tienes {count} notificaciones nuevas.',
    newVersion: 'Una nueva versión está disponible. Por favor, actualiza la página.',
    offlineMode: 'Estás desconectado. Algunas funciones pueden no estar disponibles.',
    onlineMode: 'Has vuelto a estar en línea.',
  },

  // Panel
  dashboard: {
    title: 'Panel',
    totalUsers: 'Usuarios Totales',
    activeUsers: 'Usuarios Activos',
    newUsers: 'Nuevos Usuarios',
    activeProjects: 'Proyectos Activos',
    completedProjects: 'Proyectos Completados',
    totalProjects: 'Proyectos Totales',
    revenue: 'Ingresos',
    expenses: 'Gastos',
    profit: 'Ganancias',
    totalRevenue: 'Ingresos Totales',
    monthlyRevenue: 'Ingresos Mensuales',
    yearlyRevenue: 'Ingresos Anuales',
    recentActivity: 'Actividad Reciente',
    viewAll: 'Ver Todo',
    noActivity: 'No hay actividad reciente',
    lastUpdated: 'Última actualización: {time}',
    analytics: 'Analíticas',
    reports: 'Informes',
    insights: 'Perspectivas',
    trends: 'Tendencias',
    overview: 'Resumen',
    stats: 'Estadísticas',
    performance: 'Rendimiento',
    growth: 'Crecimiento',
    conversion: 'Conversión',
    retention: 'Retención',
    engagement: 'Compromiso',
    satisfaction: 'Satisfacción',
    goals: 'Objetivos',
    achievements: 'Logros',
    milestones: 'Hitos',
  },

  // Usuarios
  users: {
    title: 'Gestión de Usuarios',
    list: 'Lista de Usuarios',
    addUser: 'Agregar Usuario',
    editUser: 'Editar Usuario',
    deleteUser: 'Eliminar Usuario',
    deleteUsers: 'Eliminar Usuarios',
    name: 'Nombre',
    email: 'Correo Electrónico',
    role: 'Rol',
    status: 'Estado',
    createdAt: 'Creado',
    updatedAt: 'Actualizado',
    lastLogin: 'Último Acceso',
    actions: 'Acciones',
    confirmDelete: '¿Estás seguro de que deseas eliminar este usuario?',
    confirmDeleteMultiple: '¿Estás seguro de que deseas eliminar {count} usuarios?',
    successCreate: 'Usuario creado correctamente.',
    successUpdate: 'Usuario actualizado correctamente.',
    successDelete: 'Usuario eliminado correctamente.',
    successDeleteMultiple: '{count} usuarios eliminados correctamente.',
    noUsers: 'No se encontraron usuarios.',
    searchPlaceholder: 'Buscar usuarios...',
    filterPlaceholder: 'Filtrar por rol...',
    roles: {
      admin: 'Administrador',
      editor: 'Editor',
      viewer: 'Espectador',
      contributor: 'Colaborador',
      manager: 'Gerente',
      developer: 'Desarrollador',
      designer: 'Diseñador',
      moderator: 'Moderador',
      support: 'Agente de Soporte',
    },
    fields: {
      firstName: 'Nombre',
      lastName: 'Apellido',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar Contraseña',
      role: 'Rol',
      status: 'Estado',
      phone: 'Teléfono',
      address: 'Dirección',
      city: 'Ciudad',
      state: 'Estado/Provincia',
      zipCode: 'Código Postal',
      country: 'País',
      bio: 'Biografía',
      avatar: 'Avatar',
    },
    validation: {
      nameRequired: 'El nombre es requerido',
      emailRequired: 'El correo electrónico es requerido',
      emailInvalid: 'Por favor, introduce un correo válido',
      passwordRequired: 'La contraseña es requerida',
      passwordMinLength: 'La contraseña debe tener al menos 8 caracteres',
      passwordMatch: 'Las contraseñas no coinciden',
      roleRequired: 'El rol es requerido',
    },
  },

  // Proyectos
  projects: {
    title: 'Gestión de Proyectos',
    list: 'Lista de Proyectos',
    addProject: 'Agregar Proyecto',
    editProject: 'Editar Proyecto',
    deleteProject: 'Eliminar Proyecto',
    deleteProjects: 'Eliminar Proyectos',
    name: 'Nombre del Proyecto',
    description: 'Descripción',
    status: 'Estado',
    progress: 'Progreso',
    team: 'Equipo',
    dueDate: 'Fecha de Entrega',
    priority: 'Prioridad',
    budget: 'Presupuesto',
    spent: 'Gastado',
    remaining: 'Restante',
    createdAt: 'Creado',
    updatedAt: 'Actualizado',
    actions: 'Acciones',
    confirmDelete: '¿Estás seguro de que deseas eliminar este proyecto?',
    confirmDeleteMultiple: '¿Estás seguro de que deseas eliminar {count} proyectos?',
    successCreate: 'Proyecto creado correctamente.',
    successUpdate: 'Proyecto actualizado correctamente.',
    successDelete: 'Proyecto eliminado correctamente.',
    successDeleteMultiple: '{count} proyectos eliminados correctamente.',
    noProjects: 'No se encontraron proyectos.',
    searchPlaceholder: 'Buscar proyectos...',
    filterPlaceholder: 'Filtrar por estado...',
    priorities: {
      critical: 'Crítico',
      high: 'Alta',
      medium: 'Media',
      low: 'Baja',
      none: 'Ninguna',
    },
    statuses: {
      planning: 'Planificación',
      'in-progress': 'En Progreso',
      'in-review': 'En Revisión',
      completed: 'Completado',
      cancelled: 'Cancelado',
      onHold: 'En Espera',
    },
    fields: {
      name: 'Nombre del Proyecto',
      description: 'Descripción',
      status: 'Estado',
      priority: 'Prioridad',
      dueDate: 'Fecha de Entrega',
      budget: 'Presupuesto',
      team: 'Miembros del Equipo',
      tags: 'Etiquetas',
      category: 'Categoría',
      attachments: 'Adjuntos',
    },
  },


settings: {
  general: 'Configuración General',
  language: 'Idioma',
  theme: 'Tema',
  saveChanges: 'Guardar Cambios',
  resetToDefault: 'Restablecer a Valores Predeterminados',
  cancel: 'Cancelar Cambios',
  confirmReset: '¿Estás seguro de que deseas restablecer todos los ajustes?',
  successUpdate: 'Configuración actualizada correctamente.',
  themes: {
    dark: 'Oscuro',
    light: 'Claro',
    ocean: 'Océano',
    sunset: 'Atardecer',
    forest: 'Bosque',
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
    email: 'Notificaciones por Correo',
    push: 'Notificaciones Push',
    sms: 'Notificaciones por SMS',
    inApp: 'Notificaciones en la Aplicación',
    marketing: 'Comunicaciones de Marketing',
    updates: 'Actualizaciones del Producto',
    security: 'Alertas de Seguridad',
    account: 'Actividad de la Cuenta',
  },
  security: {
    twoFactorAuth: 'Autenticación de Dos Factores',
    sessionTimeout: 'Tiempo de Sesión (minutos)',
    maxLoginAttempts: 'Intentos de Inicio de Sesión Máximos',
    passwordPolicy: 'Política de Contraseñas',
    requireSpecialChar: 'Requerir Carácter Especial',
    requireNumber: 'Requerir Número',
    requireUppercase: 'Requerir Mayúscula',
    requireLowercase: 'Requerir Minúscula',
    minLength: 'Longitud Mínima',
    passwordExpiry: 'Caducidad de Contraseña (días)',
  },
  appearance: {
    sidebarCollapsed: 'Colapsar Barra Lateral',
    compactView: 'Vista Compacta',
    animations: 'Habilitar Animaciones',
    fontSize: 'Tamaño de Fuente',
    fontSizes: {
      small: 'Pequeño',
      medium: 'Mediano',
      large: 'Grande',
    },
    colorScheme: 'Esquema de Colores',
  },
},

  // Autenticación
  auth: {
    login: {
      title: 'Iniciar Sesión',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      rememberMe: 'Recordarme',
      forgotPassword: '¿Olvidaste tu Contraseña?',
      signIn: 'Iniciar Sesión',
      noAccount: '¿No tienes una cuenta?',
      signUp: 'Registrarse',
      error: 'Correo o contraseña inválidos',
      success: 'Sesión iniciada correctamente',
    },
    register: {
      title: 'Crear Cuenta',
      name: 'Nombre Completo',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar Contraseña',
      agreeTerms: 'Acepto los Términos de Servicio',
      signUp: 'Crear Cuenta',
      alreadyHaveAccount: '¿Ya tienes una cuenta?',
      signIn: 'Iniciar Sesión',
      error: 'Registro fallido. Por favor, inténtalo de nuevo.',
      success: 'Cuenta creada correctamente',
    },
    resetPassword: {
      title: 'Restablecer Contraseña',
      email: 'Correo Electrónico',
      submit: 'Enviar Enlace de Restablecimiento',
      backToLogin: 'Volver a Iniciar Sesión',
      error: 'Correo no encontrado',
      success: 'Enlace de restablecimiento enviado a tu correo',
    },
  },

  // Tiempo y fecha
  time: {
    now: 'Ahora',
    seconds: 'segundos',
    minutes: 'minutos',
    hours: 'horas',
    days: 'días',
    weeks: 'semanas',
    months: 'meses',
    years: 'años',
    justNow: 'Ahora mismo',
    minuteAgo: 'Hace un minuto',
    minutesAgo: 'Hace {count} minutos',
    hourAgo: 'Hace una hora',
    hoursAgo: 'Hace {count} horas',
    dayAgo: 'Hace un día',
    daysAgo: 'Hace {count} días',
    weekAgo: 'Hace una semana',
    weeksAgo: 'Hace {count} semanas',
    monthAgo: 'Hace un mes',
    monthsAgo: 'Hace {count} meses',
    yearAgo: 'Hace un año',
    yearsAgo: 'Hace {count} años',
  },

  // Paginación
  pagination: {
    showing: 'Mostrando',
    of: 'de',
    items: 'elementos',
    page: 'Página',
    previous: 'Anterior',
    next: 'Siguiente',
    first: 'Primero',
    last: 'Último',
    rowsPerPage: 'Filas por página:',
  },

  // Subida de archivos
  upload: {
    dragAndDrop: 'Arrastra y suelta archivos aquí, o haz clic para explorar',
    maxSize: 'Tamaño máximo de archivo: {size}MB',
    acceptedTypes: 'Tipos de archivo aceptados: {types}',
    uploading: 'Subiendo...',
    uploadComplete: 'Subida completada',
    uploadFailed: 'Subida fallida',
    removeFile: 'Eliminar archivo',
    fileTooLarge: 'Archivo demasiado grande',
    fileTypeNotSupported: 'Tipo de archivo no soportado',
    maxFilesExceeded: 'Número máximo de archivos excedido',
  },
}

// ──────────────────────────────────────────────────────────────
// EXPORTS
// ──────────────────────────────────────────────────────────────

export const t = createTranslator(translations)
export { translations as default }

// Helper exports
export { interpolate, pluralize, getNestedValue, createTranslator }