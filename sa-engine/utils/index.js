/**
 * Utility functions for Super Agents
 */

export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}

export function validateRequired(obj, fields) {
  const missing = fields.filter(field => !obj[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function isValidTask(task) {
  return task && 
         typeof task.id === 'string' && 
         typeof task.title === 'string' && 
         typeof task.status === 'string';
}

export function isValidAgent(agent) {
  return agent && 
         typeof agent.name === 'string' && 
         typeof agent.role === 'string';
}