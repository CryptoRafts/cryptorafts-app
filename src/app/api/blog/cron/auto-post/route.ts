/**
 * Cron Job: Auto-Post Blog
 * 
 * This endpoint runs on a schedule (via Vercel Cron)
 * Checks if auto-posting is enabled and generates/posts blogs automatically
 * 
 * Schedule: Daily at 9 AM UTC (configurable in vercel.json)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  // Vercel Cron jobs send a special header - verify it's from Vercel
  // For security, you can also check CRON_SECRET if set
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  
  // Vercel also sends x-vercel-cron header - check for that too
  const vercelCron = request.headers.get('x-vercel-cron');
  if (!vercelCron && !cronSecret) {
    // Allow if no secret is set (for initial setup and manual testing)
    console.log('⚠️ No CRON_SECRET set, allowing request (set CRON_SECRET for production)');
  }
  
  // Also allow manual triggers from admin (check for admin token or allow in dev)
  const isManualTrigger = !vercelCron && !cronSecret;
  if (isManualTrigger) {
    console.log('📋 Manual trigger detected - allowing request');
  }

  try {
    console.log('🤖 Auto-posting cron job triggered');
    
    // Try to get Admin DB (for checking settings and creating posts)
    let db;
    try {
      db = getAdminDb();
    } catch (dbError: any) {
      console.error('❌ [CRON] Firebase Admin SDK not available:', dbError?.message);
      console.log('🔄 [CRON] Admin SDK not configured - cron job requires Admin SDK');
      
      // For cron jobs, we need Admin SDK - can't use client-side fallback
      // Return error but don't fail completely - log it
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin SDK not configured',
        message: 'Cron job requires Firebase Admin SDK. Please set FIREBASE_SERVICE_ACCOUNT_B64 in Vercel.',
        help: 'See: https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // Check if auto-posting is enabled
    const settingsRef = db.collection('blog_settings').doc('auto_posting');
    const settingsDoc = await settingsRef.get();
    const settings = settingsDoc.data();
    
    if (!settings?.enabled) {
      console.log('⏸️ Auto-posting is disabled, skipping...');
      return NextResponse.json({
        success: true,
        message: 'Auto-posting is disabled',
        skipped: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Auto-posting is enabled, generating blog post...');

    // Check if we already posted today (avoid duplicates)
    // Use a more flexible check - check for posts created in the last 23 hours
    const now = new Date();
    const yesterday = new Date(now.getTime() - 23 * 60 * 60 * 1000); // 23 hours ago
    const yesterdayStart = admin.firestore.Timestamp.fromDate(yesterday);
    
    const postsRef = db.collection('blog_posts');
    const recentPosts = await postsRef
      .where('createdAt', '>=', yesterdayStart)
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (!recentPosts.empty) {
      const lastPost = recentPosts.docs[0].data();
      const lastPostTime = lastPost.createdAt?.toDate?.() || new Date(lastPost.createdAt?.seconds * 1000);
      const hoursSinceLastPost = (now.getTime() - lastPostTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastPost < 23) {
        console.log(`ℹ️ Blog post already created ${Math.round(hoursSinceLastPost)} hours ago, skipping...`);
        return NextResponse.json({
          success: true,
          message: `Blog post already created ${Math.round(hoursSinceLastPost)} hours ago`,
          skipped: true,
          lastPostTime: lastPostTime.toISOString(),
          timestamp: new Date().toISOString()
        });
      }
    }

    // Call the generate-auto endpoint internally (it has all the logic)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://cryptorafts.com';
    
    try {
      // Create a mock request for the generate-auto endpoint
      const generateResponse = await fetch(`${baseUrl}/api/blog/generate-auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Add internal header to bypass auth if needed
        body: JSON.stringify({ source: 'cron' })
      });

      const generateData = await generateResponse.json();

      if (generateData.success) {
        // If it requires client-side creation, we can't do that in cron
        if (generateData.requiresClientSideCreation) {
          console.log('⚠️ [CRON] Post generated but requires client-side creation (Admin SDK not configured)');
          return NextResponse.json({
            success: false,
            error: 'Post generated but requires client-side creation',
            message: 'Cron job cannot use client-side Firestore. Please configure Firebase Admin SDK.',
            help: 'Set FIREBASE_SERVICE_ACCOUNT_B64 in Vercel environment variables',
            timestamp: new Date().toISOString()
          }, { status: 503 });
        }

        if (!generateData.postId) {
          console.error('❌ [CRON] Post generated but no postId returned');
          return NextResponse.json({
            success: false,
            error: 'Post generated but no postId returned',
            message: generateData.message || 'Unknown error',
            timestamp: new Date().toISOString()
          }, { status: 500 });
        }

        console.log('✅ [CRON] Blog post generated and created:', generateData.postId);

        // Get connected platforms and auto-post
        const platformsRef = db.collection('blog_platforms');
        const platformsSnapshot = await platformsRef.get();
        const connectedPlatforms = platformsSnapshot.docs
          .filter(doc => doc.data().connected === true)
          .map(doc => doc.id);

        console.log('📱 Connected platforms:', connectedPlatforms);

        // Post to connected platforms
        if (connectedPlatforms.length > 0 && generateData.postId) {
          try {
            console.log(`📤 [CRON] Posting to ${connectedPlatforms.length} platform(s):`, connectedPlatforms);
            const publishResponse = await fetch(`${baseUrl}/api/blog/admin/publish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postId: generateData.postId,
                platforms: connectedPlatforms,
              }),
            });

            if (publishResponse.ok) {
              const publishData = await publishResponse.json();
              console.log('✅ [CRON] Posted to platforms:', publishData.platforms || connectedPlatforms);
            } else {
              const errorData = await publishResponse.json();
              console.error('❌ [CRON] Failed to post to platforms:', errorData);
            }
          } catch (error: any) {
            console.error('❌ [CRON] Error posting to platforms:', error?.message || error);
          }
        } else {
          if (connectedPlatforms.length === 0) {
            console.log('ℹ️ [CRON] No connected platforms found, skipping social media posting');
          }
          if (!generateData.postId) {
            console.error('❌ [CRON] No postId available for platform posting');
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Blog post generated and published successfully',
          postId: generateData.postId,
          title: generateData.title,
          platforms: connectedPlatforms,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error(generateData.error || 'Failed to generate blog post');
      }
    } catch (generateError: any) {
      console.error('❌ [CRON] Error calling generate-auto:', generateError);
      throw generateError;
    }

  } catch (error: any) {
    console.error('❌ Auto-posting cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate blog post',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

