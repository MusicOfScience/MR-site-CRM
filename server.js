// server.js
// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');
const path = require('path');

// Create the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static assets from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// --- Email Routing Rules ---
// In a real application, these would be loaded and editable via the admin panel.
let emailRoutingRules = {
  "NDIS": "NDIS Inquiry",
  "Services Australia": "Services Australia Inquiry",
  "Aged Care": "Aged Care Inquiry",
  "Medicare": "Medicare Inquiry",
  "Australian Tax Office": "ATO Inquiry",
  "Visa and Immigration Issues": "Visa/Immigration Inquiry",
  "Flag Request": "Flag Request Inquiry",
  "Meeting Request": "Meeting Request",
  "Event Invitation": "Event Invitation"
};

// --- Set up Nodemailer transporter ---
// For Google Workspace integration, you might use OAuth2 or an app password.
// For testing, we send emails to hudson@moniqueryan.com.au.
let transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'yourgmailaccount@gmail.com',
    pass: 'yourgmailpassword'
  }
});

// --- Helper function to generate DOCX for meeting briefs ---
async function generateMeetingDocx(formData) {
  // Create a new Document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: "Meeting Brief", heading: "Heading1" }),
          new Paragraph({ text: `Meeting Title: ${formData.meetingTitle || ""}` }),
          new Paragraph({ text: `Location: ${formData.location || ""}` }),
          new Paragraph({ text: `Date & Time: ${formData.meetingDateTime || ""}` }),
          new Paragraph({ text: `Attendees: ${formData.attendees || ""}` }),
          new Paragraph({ text: `Contact Person/Phone: ${formData.contactPerson || ""}` }),
          new Paragraph({ text: `Purpose: ${formData.meetingPurpose || ""}` }),
          new Paragraph({ text: `Previous Meetings/Engagements: ${formData.previousNotes || ""}` }),
          new Paragraph({ text: `Initiated By: ${formData.initiatedBy || ""}` }),
          new Paragraph({ text: `Agenda: ${formData.agenda || ""}` }),
          new Paragraph({ text: `Background Notes: ${formData.backgroundNotes || ""}` }),
          new Paragraph({ text: `Meeting Notes: ${formData.meetingNotes || ""}` })
        ]
      }
    ]
  });
  // Generate the DOCX file
  const buffer = await Packer.toBuffer(doc);
  // Create a filename based on a convention – here using the meeting title and current timestamp
  const filename = `MeetingBrief_${formData.meetingTitle ? formData.meetingTitle.replace(/\s+/g, '_') : 'Untitled'}_${Date.now()}.docx`;
  const filePath = path.join(__dirname, 'generated_docs', filename);
  // Ensure the folder exists
  fs.mkdirSync(path.join(__dirname, 'generated_docs'), { recursive: true });
  fs.writeFileSync(filePath, buffer);
  return { filename, filePath };
}

// --- Route to process form submissions ---
app.post('/submit', async (req, res) => {
  try {
    // Extract form data from the request
    const formData = req.body;
    const category = formData.category;
    // Determine the email subject from the routing rules
    let subject = emailRoutingRules[category] || "General Inquiry";
    // For sub-categories (for example under Services Australia), you might append the subcategory value
    if (formData.subCategory) {
      subject += ` - ${formData.subCategory}`;
    }
    
    // Build the email body from the form fields (for simplicity, we just convert the JSON)
    const emailBody = `
Inquiry Category: ${category}
${formData.subCategory ? "Sub Category: " + formData.subCategory : ""}
Name: ${formData.name || ""}
Email: ${formData.email || ""}
Phone: ${formData.phone || ""}
Message: ${formData.message || ""}
Additional Details: ${formData.details || ""}
    `;
    
    // For Meeting Requests and Event Invitations, generate a DOCX briefing note.
    let docAttachment = null;
    if (category === "Meeting Request" || category === "Event Invitation") {
      const docxResult = await generateMeetingDocx(formData);
      docAttachment = {
        filename: docxResult.filename,
        path: docxResult.filePath
      };
    }
    
    // Set up email options
    let mailOptions = {
      from: '"Microsite Inquiry" <yourgmailaccount@gmail.com>',
      to: "hudson@moniqueryan.com.au", // for testing
      subject: subject,
      text: emailBody,
      // If DOCX generated, attach it:
      attachments: docAttachment ? [docAttachment] : []
    };
    
    // Send the email via the transporter
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ success: false, message: "Email failed to send." });
      }
      console.log("Email sent: " + info.response);
      return res.status(200).json({ success: true, message: "Inquiry submitted successfully." });
    });
  } catch (err) {
    console.error("Submission error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// --- Admin Panel Route ---
// A simple page to view and update email routing rules. (For full functionality, secure this route.)
app.get('/admin', (req, res) => {
  let html = `<html><head><title>Admin Panel</title></head><body>
    <h1>Email Routing Rules</h1>
    <pre>${JSON.stringify(emailRoutingRules, null, 2)}</pre>
    <!-- In a full implementation, add forms to update the routing rules -->
    </body></html>`;
  res.send(html);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
