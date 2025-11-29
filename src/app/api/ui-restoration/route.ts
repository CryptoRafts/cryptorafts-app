import { NextRequest, NextResponse } from 'next/server';
import { uiRestorationManager } from '@/lib/ui-restoration';

export async function GET(request: NextRequest) {
  try {
    const status = uiRestorationManager.getStatus();
    const report = uiRestorationManager.getReport();
    
    return NextResponse.json({
      success: true,
      status,
      report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting UI restoration status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get UI restoration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, componentName } = body;

    switch (action) {
      case 'restore-all':
        const result = await uiRestorationManager.restoreAllComponents();
        return NextResponse.json({
          success: true,
          message: `Restored ${result.success} components, ${result.failed} failed`,
          result
        });

      case 'restore-component':
        if (!componentName) {
          return NextResponse.json(
            { success: false, error: 'Component name is required' },
            { status: 400 }
          );
        }
        
        const restored = await uiRestorationManager.restoreComponent(componentName);
        return NextResponse.json({
          success: restored,
          message: restored 
            ? `Component ${componentName} restored successfully`
            : `Failed to restore component ${componentName}`
        });

      case 'check-health':
        if (!componentName) {
          return NextResponse.json(
            { success: false, error: 'Component name is required' },
            { status: 400 }
          );
        }
        
        const isHealthy = await uiRestorationManager.checkComponentHealth(componentName);
        return NextResponse.json({
          success: true,
          componentName,
          isHealthy
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in UI restoration API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process UI restoration request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
