/**
 * Version Configuration Module
 * This module defines the API versioning configuration and supported features
 */

// List of all supported API versions
export const SUPPORTED_VERSIONS = ["v1"];

// Current default API version
export const DEFAULT_VERSION = "v1";

// Version deprecation dates - when a version will be discontinued
export const VERSION_DEPRECATION = {
  v1: "2026-12-31", // Example: v1 will be supported until end of 2026
};

/**
 * Feature flags and capabilities for each API version
 * Use this to gradually roll out features across versions
 */
export const VERSION_FEATURES = {
  v1: {
    pagination: {
      enabled: true,
      maxLimit: 100,
      defaultLimit: 20,
    },
    filtering: {
      enabled: true,
      maxDepth: 3, // Maximum nesting level for filters
    },
    sorting: {
      enabled: true,
      maxFields: 3, // Maximum number of fields to sort by
    },
    security: {
      rowLevelSecurity: true,
      fieldLevelSecurity: false, // Planned for v2
    },
    resources: {
      // List of resources supported in this version
      supported: ["base_resource", "users", "companies", "products"],
      // Resource field mappings for backwards compatibility
      fieldMappings: {
        base_resource: {
          // Example: map legacy field names to new ones
          // 'old_field_name': 'new_field_name'
        },
      },
    },
  },
  // Add new versions here with their features
  // 'v2': { ... }
};
