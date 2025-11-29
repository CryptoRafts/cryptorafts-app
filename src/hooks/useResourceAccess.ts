/**
 * useResourceAccess Hook
 * Enforces userID-scoped isolation for all resources
 * Show only resources where userID ∈ members; deny others
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { userIsolationService, ResourceAccess } from '@/lib/user-isolation-service';

export function useResourceAccess(resourceType: string, resourceId: string, requiredPermission: string = 'read') {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setHasAccess(false);
      setIsLoading(false);
      return;
    }

    const checkAccess = async () => {
      try {
        setIsLoading(true);
        const access = await userIsolationService.hasAccess(
          user.uid,
          resourceType,
          resourceId,
          requiredPermission
        );
        setHasAccess(access);
        setError(null);
      } catch (err) {
        console.error('Error checking access:', err);
        setError('Failed to verify access');
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [user?.uid, resourceType, resourceId, requiredPermission]);

  return { hasAccess, isLoading, error };
}

export function useUserResources(resourceType?: string) {
  const { user } = useAuth();
  const [resources, setResources] = useState<ResourceAccess[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    if (!user?.uid) {
      setResources([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userResources = await userIsolationService.getUserResources(user.uid, resourceType);
      setResources(userResources);
      setError(null);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to load resources');
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, resourceType]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  return { resources, isLoading, error, refetch: fetchResources };
}

export function useGrantAccess() {
  const { user } = useAuth();
  const [isGranting, setIsGranting] = useState<boolean>(false);

  const grantAccess = async (
    resourceType: string,
    resourceId: string,
    targetUserId: string,
    permissions: string[]
  ): Promise<boolean> => {
    if (!user?.uid) {
      return false;
    }

    try {
      setIsGranting(true);
      const success = await userIsolationService.grantAccess(
        resourceType,
        resourceId,
        user.uid,
        targetUserId,
        permissions
      );
      return success;
    } catch (error) {
      console.error('Error granting access:', error);
      return false;
    } finally {
      setIsGranting(false);
    }
  };

  return { grantAccess, isGranting };
}

export function useRevokeAccess() {
  const { user } = useAuth();
  const [isRevoking, setIsRevoking] = useState<boolean>(false);

  const revokeAccess = async (
    resourceType: string,
    resourceId: string,
    targetUserId: string
  ): Promise<boolean> => {
    if (!user?.uid) {
      return false;
    }

    try {
      setIsRevoking(true);
      const success = await userIsolationService.revokeAccess(
        resourceType,
        resourceId,
        user.uid,
        targetUserId
      );
      return success;
    } catch (error) {
      console.error('Error revoking access:', error);
      return false;
    } finally {
      setIsRevoking(false);
    }
  };

  return { revokeAccess, isRevoking };
}

export function useCreateResource() {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const createResource = async (
    resourceType: string,
    resourceId: string,
    teamId?: string,
    initialMembers: string[] = []
  ): Promise<boolean> => {
    if (!user?.uid) {
      return false;
    }

    try {
      setIsCreating(true);
      await userIsolationService.createResourceAccess(
        resourceType,
        resourceId,
        user.uid,
        teamId,
        initialMembers
      );
      return true;
    } catch (error) {
      console.error('Error creating resource:', error);
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  return { createResource, isCreating };
}

