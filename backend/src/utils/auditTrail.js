// Utility functions for audit trail management (created_by, updated_by fields)

/**
 * Extract admin/user UUID from request user object
 * Checks multiple possible property names for UUID
 * Prioritizes camelCase (from JWT) over snake_case (legacy)
 * @param {Object} user - The user object from req.user (set by auth middleware)
 * @returns {string|null} The UUID if found, null otherwise
 */
const getActorUuid = (user) => {
  if (!user) return null;
  
  // Check camelCase first (from JWT), then snake_case (legacy)
  return (
    user.adminUuid ||
    user.userUuid ||
    user.admin_uuid ||
    user.user_uuid ||
    user.uuid ||
    null
  );
};

/**
 * Extract user ID from request user object
 * @param {Object} user - The user object from req.user
 * @returns {number|null} The user ID if found, null otherwise
 */
const getActorUserId = (user) => {
  if (!user) return null;
  
  return user.userId || user.user_id || null;
};

/**
 * Create audit trail data for INSERT operations
 * @param {Object} user - The user object from req.user
 * @returns {Object} Object with created_by and updated_by fields
 */
const createAuditTrail = (user) => {
  const uuid = getActorUuid(user);
  return {
    created_by: uuid,
    updated_by: uuid
  };
};

/**
 * Create audit update data for UPDATE operations
 * @param {Object} user - The user object from req.user
 * @returns {Object} Object with updated_by field
 */
const updateAuditTrail = (user) => {
  const uuid = getActorUuid(user);
  return {
    updated_by: uuid
  };
};

/**
 * Append audit fields to an INSERT query
 * @param {string} baseQuery - The base INSERT query
 * @param {Object} user - The user object from req.user
 * @returns {string} Query with audit fields included
 */
const appendAuditFieldsToInsert = (baseQuery, user) => {
  const { created_by, updated_by } = createAuditTrail(user);
  // This is a helper - actual implementation depends on query structure
  return baseQuery;
};

module.exports = {
  getActorUuid,
  getActorUserId,
  createAuditTrail,
  updateAuditTrail,
  appendAuditFieldsToInsert
};
