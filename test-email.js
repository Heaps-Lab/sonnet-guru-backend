// Test Email Script - Verify SMTP Configuration
require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 Testing Email Configuration...\n');

// Load config from .env
const config = {
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT),
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {
    // Don't fail on invalid certificates (for development/cPanel environments)
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',
  },
};

console.log('📧 Email Configuration:');
console.log(`   Host: ${config.host}`);
console.log(`   Port: ${config.port}`);
console.log(`   User: ${config.auth.user}`);
console.log(
  `   Pass: ${config.auth.pass ? '***' + config.auth.pass.slice(-4) : 'NOT SET'}`,
);
console.log(`   Secure: ${config.secure}`);
console.log(`   From: ${process.env.MAIL_FROM}\n`);

// Create transporter
const transporter = nodemailer.createTransport(config);

// Step 1: Verify connection
console.log('🔌 Step 1: Verifying SMTP connection...');
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Failed!');
    console.error('Error:', error.message);
    console.error('\n🔧 Troubleshooting:');

    if (error.code === 'EAUTH') {
      console.error('   - Invalid username or password');
      console.error('   - For Gmail: Use App Password, not regular password');
      console.error(
        '   - Generate at: https://myaccount.google.com/apppasswords',
      );
    } else if (error.code === 'ECONNECTION') {
      console.error('   - Cannot connect to mail server');
      console.error('   - Check your internet connection');
      console.error('   - Verify MAIL_HOST and MAIL_PORT');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   - Connection timeout');
      console.error('   - Check firewall settings');
      console.error('   - Verify port 587 is not blocked');
    }
    process.exit(1);
  } else {
    console.log('✅ SMTP Connection Successful!\n');

    // Step 2: Send test email
    const testEmail = process.argv[2] || config.auth.user;
    console.log(`📨 Step 2: Sending test email to ${testEmail}...`);

    const mailOptions = {
      from: `"${process.env.APP_NAME}" <${process.env.MAIL_FROM}>`,
      to: testEmail,
      subject: 'Test Email from Sonnet Guru LMS',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">🎉 Email Test Successful!</h2>
          <p>If you're reading this, your email configuration is working correctly.</p>
          <div style="background-color: #F0FDF4; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Configuration Details:</strong>
            <ul>
              <li>Host: ${config.host}</li>
              <li>Port: ${config.port}</li>
              <li>From: ${process.env.MAIL_FROM}</li>
              <li>App: ${process.env.APP_NAME}</li>
            </ul>
          </div>
          <p>Your email verification system is ready to use! 🚀</p>
          <p style="color: #666; font-size: 12px;">Test performed at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Failed to send test email!');
        console.error('Error:', error.message);
        process.exit(1);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        console.log(`\n🎉 Email system is fully functional!`);
        console.log(`\n💡 Check ${testEmail} for the test email.`);
      }
    });
  }
});
