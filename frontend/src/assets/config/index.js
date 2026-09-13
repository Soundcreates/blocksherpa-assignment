// Configuration Entry Point
import apiEndpoints from './api-endpoints.json'

const environment = import.meta.env?.MODE || 'development'
const config = apiEndpoints[environment] || apiEndpoints.development

export const API_CONFIG = {
  baseUrl: config.baseUrl,
  endpoints: config.endpoints,
  environment,
}

export const isDevelopment = environment === 'development'
export const isProduction = environment === 'production'
export const isTest = environment === 'test'

export const getEndpoint = (section, key, params = {}) => {
  let endpoint = API_CONFIG.endpoints?.[section]?.[key]
  if (!endpoint) {
    console.warn(`Endpoint not found: ${section}.${key}`)
    return ''
  }
  Object.entries(params).forEach(([param, value]) => {
    endpoint = endpoint.replace(`{${param}}`, value)
  })
  return endpoint
}

export default {
  API_CONFIG,
  isDevelopment,
  isProduction,
  isTest,
  getEndpoint,
}