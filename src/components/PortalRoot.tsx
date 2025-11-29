"use client";

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface PortalRootProps {
  children: React.ReactNode;
  id?: string;
}

export default function PortalRoot({ children, id = 'portal-root' }: PortalRootProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Create portal root if it doesn't exist
    if (!document.getElementById(id)) {
      const portalRoot = document.createElement('div');
      portalRoot.id = id;
      portalRoot.style.position = 'relative';
      portalRoot.style.zIndex = '1000';
      document.body.appendChild(portalRoot);
    }

    return () => {
      // Clean up portal root on unmount
      const portalRoot = document.getElementById(id);
      if (portalRoot && portalRoot.children.length === 0) {
        document.body.removeChild(portalRoot);
      }
    };
  }, [id]);

  if (!mounted) return null;

  const portalRoot = document.getElementById(id);
  if (!portalRoot) return null;

  return createPortal(children, portalRoot);
}
