"use client";

import { useEffect, useState } from 'react';
import { clearAllRoleData, forceRoleSelection, getCurrentRoleData } from '@/utils/roleUtils';

export default function RoleDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const info = getCurrentRoleData();
    setDebugInfo(info);
  }, []);

  const handleClearAllRoleData = () => {
    clearAllRoleData();
    window.location.reload();
  };

  const handleForceRoleSelection = () => {
    forceRoleSelection();
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Role Debug Info:</h4>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      <button 
        onClick={handleClearAllRoleData}
        style={{
          background: 'red',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '3px',
          cursor: 'pointer',
          marginTop: '5px',
          marginRight: '5px'
        }}
      >
        Clear All Role Data
      </button>
      <button 
        onClick={handleForceRoleSelection}
        style={{
          background: 'blue',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '3px',
          cursor: 'pointer',
          marginTop: '5px'
        }}
      >
        Force Role Selection
      </button>
    </div>
  );
}
