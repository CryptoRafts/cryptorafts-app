#!/usr/bin/env node

/**
 * 🚀 COMPLETE AUTOMATED EMAIL SYSTEM WITH LOGO
 * This script does EVERYTHING automatically once you have Gmail App Password
 */

import nodemailer from 'nodemailer';
import { readFileSync, existsSync } from 'fs';

console.log('🚀 CryptoRafts Complete Automated Email System');
console.log('==============================================\n');

// Professional email template with CryptoRafts logo
function createProfessionalEmailTemplate(userData) {
  const fullName = `${userData.firstName} ${userData.lastName}`;
  
  return {
    subject: '🎉 Welcome to CryptoRafts - Your Account Has Been Approved!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Approved - CryptoRafts</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6); color: white; padding: 40px 30px; text-align: center; position: relative; }
          .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>'); }
          .logo { width: 120px; height: 60px; margin-bottom: 20px; background: white; border-radius: 12px; display: inline-block; box-shadow: 0 5px 15px rgba(0,0,0,0.2); position: relative; z-index: 1; }
          .content { padding: 40px 30px; background: #f8fafc; }
          .button { display: inline-block; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; box-shadow: 0 5px 15px rgba(6, 182, 212, 0.3); transition: transform 0.3s ease; }
          .button:hover { transform: translateY(-2px); }
          .footer { background: #1f2937; color: white; padding: 30px; text-align: center; }
          .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
          .feature { background: white; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.1); transition: transform 0.3s ease; }
          .feature:hover { transform: translateY(-5px); }
          .feature-icon { font-size: 32px; margin-bottom: 15px; }
          .highlight-box { background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-left: 4px solid #06b6d4; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .stats { display: flex; justify-content: space-around; margin: 30px 0; }
          .stat { text-align: center; }
          .stat-number { font-size: 24px; font-weight: bold; color: #06b6d4; }
          .stat-label { font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="https://via.placeholder.com/120x60/06b6d4/ffffff?text=CryptoRafts" alt="CryptoRafts Logo" style="width: 100%; height: 100%; border-radius: 12px;">
            </div>
            <h1 style="margin: 0; font-size: 32px; font-weight: bold;">🚀 Welcome to CryptoRafts!</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Your account has been approved</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Congratulations ${fullName}! 🎉</h2>
            <p style="font-size: 16px; line-height: 1.8;">We're thrilled to inform you that your CryptoRafts account has been successfully approved. You now have access to our exclusive platform where founders and investors connect to build the future of finance.</p>
            
            <div class="stats">
              <div class="stat">
                <div class="stat-number">500+</div>
                <div class="stat-label">Active Investors</div>
              </div>
              <div class="stat">
                <div class="stat-number">$50M+</div>
                <div class="stat-label">Capital Deployed</div>
              </div>
              <div class="stat">
                <div class="stat-number">100+</div>
                <div class="stat-label">Successful Deals</div>
              </div>
            </div>
            
            <div class="features">
              <div class="feature">
                <div class="feature-icon">💼</div>
                <h3 style="color: #1f2937; margin-top: 0;">Exclusive Deal Flow</h3>
                <p>Access pre-vetted investment opportunities from top-tier startups and emerging companies.</p>
              </div>
              <div class="feature">
                <div class="feature-icon">🤝</div>
                <h3 style="color: #1f2937; margin-top: 0;">Premium Networking</h3>
                <p>Connect with successful founders, investors, and industry leaders in our exclusive community.</p>
              </div>
              <div class="feature">
                <div class="feature-icon">📊</div>
                <h3 style="color: #1f2937; margin-top: 0;">Advanced Analytics</h3>
                <p>Track portfolio performance with detailed analytics and market insights.</p>
              </div>
              <div class="feature">
                <div class="feature-icon">🔒</div>
                <h3 style="color: #1f2937; margin-top: 0;">Bank-Level Security</h3>
                <p>Your investments are protected with enterprise-grade security and compliance.</p>
              </div>
            </div>
            
            <div class="highlight-box">
              <h3 style="color: #06b6d4; margin-top: 0;">🎯 What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Complete your investor profile to unlock all features</li>
                <li>Browse exclusive investment opportunities</li>
                <li>Connect with other members in our community</li>
                <li>Start building your diversified portfolio</li>
                <li>Access our premium research and insights</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="https://cryptorafts.com/founder/dashboard" class="button">
                🎯 Access Your Dashboard Now
              </a>
            </div>
            
            <p style="font-size: 16px; line-height: 1.8;">Our dedicated support team is here to help you make the most of your CryptoRafts experience. Don't hesitate to reach out if you have any questions.</p>
            
            <p style="font-size: 16px; margin-top: 30px;">Welcome to the future of investing,<br><strong style="color: #06b6d4;">The CryptoRafts Team</strong></p>
          </div>
          
          <div class="footer">
            <div style="margin-bottom: 20px;">
              <img src="https://via.placeholder.com/100x50/ffffff/06b6d4?text=CryptoRafts" alt="CryptoRafts Logo" style="width: 100px; height: 50px; border-radius: 8px;">
            </div>
            <p style="margin: 0; font-size: 16px; font-weight: bold;">CryptoRafts</p>
            <p style="margin: 5px 0; font-size: 14px; opacity: 0.8;">Connecting Founders with Capital</p>
            <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.7;">This email was sent to ${userData.email}</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.7;">
              <a href="https://cryptorafts.com/unsubscribe" style="color: #06b6d4; text-decoration: none;">Unsubscribe</a> | 
              <a href="https://cryptorafts.com/privacy" style="color: #06b6d4; text-decoration: none;">Privacy Policy</a> | 
              <a href="https://cryptorafts.com/support" style="color: #06b6d4; text-decoration: none;">Support</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to CryptoRafts!
      
      Congratulations ${fullName}!
      
      We're thrilled to inform you that your CryptoRafts account has been successfully approved. You now have access to our exclusive platform where founders and investors connect to build the future of finance.
      
      Platform Statistics:
      - 500+ Active Investors
      - $50M+ Capital Deployed  
      - 100+ Successful Deals
      
      What's Next?
      - Complete your investor profile to unlock all features
      - Browse exclusive investment opportunities
      - Connect with other members in our community
      - Start building your diversified portfolio
      - Access our premium research and insights
      
      Access your dashboard: https://cryptorafts.com/founder/dashboard
      
      Our dedicated support team is here to help you make the most of your CryptoRafts experience.
      
      Welcome to the future of investing,
      The CryptoRafts Team
      
      ---
      CryptoRafts - Connecting Founders with Capital
      This email was sent to ${userData.email}
    `
  };
}

// Complete automated email service
class CompleteEmailService {
  constructor() {
    this.config = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'business@cryptorafts.com',
        pass: 'REPLACE_WITH_YOUR_GMAIL_APP_PASSWORD' // You need to replace this
      }
    };
  }

  async sendProfessionalEmail(userData) {
    try {
      const transporter = nodemailer.createTransport(this.config);
      
      // Verify connection
      await transporter.verify();
      console.log('✅ Gmail connection successful!');
      
      const template = createProfessionalEmailTemplate(userData);
      
      const mailOptions = {
        from: `"CryptoRafts" <${this.config.auth.user}>`,
        to: userData.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Professional email with logo sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Email failed:', error.message);
      return false;
    }
  }

  async testCompleteSystem() {
    console.log('🧪 Testing Complete Automated Email System...\n');
    
    const testUser = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com', // Change this to your email
      company: 'Test Company',
      jobTitle: 'Investor'
    };

    const result = await this.sendProfessionalEmail(testUser);
    
    if (result) {
      console.log('\n🎉 SUCCESS! Complete automated system working!');
      console.log('📧 Professional email with CryptoRafts logo sent!');
      console.log('\n🚀 Ready to send approval emails to all users!');
    } else {
      console.log('\n❌ Setup needed:');
      console.log('1. Go to myaccount.google.com → Security');
      console.log('2. Enable 2-Step Verification');
      console.log('3. Generate App Password for "Mail"');
      console.log('4. Replace "REPLACE_WITH_YOUR_GMAIL_APP_PASSWORD" in this script');
      console.log('5. Run this script again');
    }
  }
}

// Run the complete automated system
const emailService = new CompleteEmailService();
emailService.testCompleteSystem();
