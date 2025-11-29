import { NextRequest, NextResponse } from 'next/server';
import { AdminEmailManager } from '@/lib/admin-email.manager';

// Admin API route for bulk email operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, kycStatus } = body;

    // Validate required fields
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let result;
    
    switch (action) {
      case 'send_approval_to_all':
        result = await AdminEmailManager.sendApprovalEmailsToAllUsers();
        break;
        
      case 'send_approval_by_kyc_status':
        if (!kycStatus) {
          return NextResponse.json(
            { error: 'KYC status is required for this action' },
            { status: 400 }
          );
        }
        result = await AdminEmailManager.sendApprovalEmailsByKYCStatus(kycStatus);
        break;
        
      case 'send_kyc_approval_notifications':
        result = await AdminEmailManager.sendKYCApprovalNotifications();
        break;
        
      default:
        return NextResponse.json(
          { 
            error: 'Invalid action. Supported actions: send_approval_to_all, send_approval_by_kyc_status, send_kyc_approval_notifications' 
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Bulk email operation completed: ${result.success} success, ${result.failed} failed`
    });

  } catch (error) {
    console.error('Admin email API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute bulk email operation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get statistics about registered users
export async function GET() {
  try {
    const allUsers = await AdminEmailManager.getAllRegisteredUsers();
    const approvedUsers = await AdminEmailManager.getUsersByKYCStatus('approved');
    const pendingUsers = await AdminEmailManager.getUsersByKYCStatus('pending');
    const submittedUsers = await AdminEmailManager.getUsersByKYCStatus('submitted');

    return NextResponse.json({
      success: true,
      statistics: {
        totalRegistered: allUsers.length,
        approved: approvedUsers.length,
        pending: pendingUsers.length,
        submitted: submittedUsers.length,
      },
      message: 'User statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Admin email statistics error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve user statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
