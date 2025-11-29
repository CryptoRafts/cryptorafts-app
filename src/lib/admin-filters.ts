"use client";

/**
 * Advanced search and filter utilities for admin pages
 */

export interface FilterOptions {
  searchTerm?: string;
  statusFilter?: string;
  roleFilter?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter array based on multiple criteria
 */
export function applyFilters<T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  additionalFilters?: {
    statusFilter?: string;
    statusField?: keyof T;
    roleFilter?: string;
    roleField?: keyof T;
  }
): T[] {
  let filtered = items;

  // Search filter
  if (searchTerm) {
    filtered = filtered.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }

  // Status filter
  if (additionalFilters?.statusFilter && additionalFilters.statusFilter !== 'all' && additionalFilters.statusField) {
    filtered = filtered.filter(item => item[additionalFilters.statusField!] === additionalFilters.statusFilter);
  }

  // Role filter
  if (additionalFilters?.roleFilter && additionalFilters.roleFilter !== 'all' && additionalFilters.roleField) {
    filtered = filtered.filter(item => item[additionalFilters.roleField!] === additionalFilters.roleFilter);
  }

  return filtered;
}

/**
 * Sort array by field
 */
export function sortItems<T>(
  items: T[],
  sortBy: keyof T,
  sortOrder: 'asc' | 'desc' = 'desc'
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    // Handle dates
    if (aVal instanceof Date && bVal instanceof Date) {
      return sortOrder === 'asc'
        ? aVal.getTime() - bVal.getTime()
        : bVal.getTime() - aVal.getTime();
    }

    // Handle numbers
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // Handle strings
    const aStr = String(aVal || '');
    const bStr = String(bVal || '');
    
    if (sortOrder === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });
}

/**
 * Remove duplicates from array based on unique field
 */
export function removeDuplicates<T>(
  items: T[],
  uniqueField: keyof T
): T[] {
  const seen = new Map();
  const result: T[] = [];

  for (const item of items) {
    const key = item[uniqueField];
    if (!seen.has(key)) {
      seen.set(key, true);
      result.push(item);
    }
  }

  return result;
}

