// Simple email service placeholder
// In production, this would integrate with a real email service like SendGrid, AWS SES, etc.

const emailService = {
  /**
   * Send email notification
   * @param {String} to - Recipient email
   * @param {String} subject - Email subject
   * @param {String} message - HTML message content
   * @returns {Promise<Object>} Email sending result
   */
  sendEmail: async (to, subject, message) => {
    try {
      // In a real implementation, this would send an actual email
      console.log('📧 Email Service - Simulated Email Send:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${message.substring(0, 200)}...`);
      console.log('✅ Email sent successfully (simulated)');
      
      return {
        success: true,
        messageId: `simulated-${Date.now()}`,
        to,
        subject
      };
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },

  /**
   * Send bulk upload completion notification
   * @param {String} to - Recipient email
   * @param {Object} upload - Bulk upload data
   * @returns {Promise<Object>} Email sending result
   */
  sendBulkUploadCompletion: async (to, upload) => {
    const subject = `Bulk Upload Completed - ${upload.filename}`;
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E7D32;">Bulk Upload Completed Successfully</h2>
        <p>Your bulk upload has been processed. Here are the details:</p>
        
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Filename:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${upload.filename}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Type:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${upload.uploadType}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Records:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${upload.totalRecords}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Successful:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd; color: #2E7D32;">${upload.successfulRecords}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Failed:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd; color: #D32F2F;">${upload.failedRecords}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Status:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${upload.status}</td>
          </tr>
        </table>

        <p>You can view the detailed results in your admin dashboard.</p>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            This is an automated notification from the Agrimaan platform. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail(to, subject, message);
  }
};

module.exports = emailService;
