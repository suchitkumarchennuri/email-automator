const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const multer = require("multer");
const csvParser = require("csv-parser");
const fs = require("fs");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Set up multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Validate email configuration
const validateEmailConfig = () => {
  const { EMAIL_SERVICE, EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_SERVICE || !EMAIL_USER || !EMAIL_PASS) {
    console.error(
      "Email configuration is incomplete. Please check your .env file."
    );
    return false;
  }

  if (
    EMAIL_USER === "your_email@gmail.com" ||
    EMAIL_PASS === "your_app_password_here"
  ) {
    console.error(
      "Default email credentials detected. Please update your .env file with real credentials."
    );
    return false;
  }

  return true;
};

// Nodemailer transporter
let transporter;
try {
  if (validateEmailConfig()) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection
    transporter.verify(function (error, success) {
      if (error) {
        console.error("Email transport verification failed:", error);
      } else {
        console.log("Email transport ready");
      }
    });
  } else {
    console.warn(
      "Email transport not initialized due to invalid configuration."
    );
  }
} catch (error) {
  console.error("Failed to initialize email transport:", error);
}

// Helper function to check transporter before sending
const checkTransporter = (res) => {
  if (!transporter) {
    return res.status(500).json({
      success: false,
      message:
        "Email service not configured properly. Please check server logs and update your .env file with valid email credentials.",
    });
  }
  return null;
};

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API endpoint to send emails
app.post(
  "/api/send-emails",
  upload.fields([
    { name: "prospects", maxCount: 1 },
    { name: "attachment", maxCount: 1 },
  ]),
  async (req, res) => {
    // Check if transporter is configured
    const transporterError = checkTransporter(res);
    if (transporterError) return transporterError;

    try {
      const { subject, body } = req.body;

      if (!subject || !body) {
        return res
          .status(400)
          .json({ success: false, message: "Subject and body are required" });
      }

      if (!req.files || !req.files.prospects) {
        return res
          .status(400)
          .json({ success: false, message: "Prospects file is required" });
      }

      const prospects = [];
      const prospectFile = req.files.prospects[0];
      const attachmentFile = req.files.attachment
        ? req.files.attachment[0]
        : null;

      // Setup email attachment if file was uploaded
      let attachments = [];
      if (attachmentFile) {
        attachments.push({
          filename: attachmentFile.originalname,
          path: attachmentFile.path,
        });
      }

      // Parse CSV file
      fs.createReadStream(prospectFile.path)
        .pipe(csvParser())
        .on("data", (data) => {
          // Log each row to debug
          console.log("CSV Row:", data);
          prospects.push(data);
        })
        .on("end", async () => {
          // Remove temporary prospect file
          fs.unlinkSync(prospectFile.path);

          if (prospects.length === 0) {
            // Also remove attachment file if it exists
            if (attachmentFile) {
              fs.unlinkSync(attachmentFile.path);
            }

            return res.status(400).json({
              success: false,
              message: "No prospects found in the file",
            });
          }

          console.log("First prospect:", prospects[0]);
          console.log("CSV columns:", Object.keys(prospects[0]));

          // Send emails to each prospect
          const results = [];

          for (const prospect of prospects) {
            // Get properties from CSV, normalize keys to lowercase
            const normalizedProspect = {};
            Object.keys(prospect).forEach((key) => {
              normalizedProspect[key.toLowerCase()] = prospect[key];
            });

            const email = normalizedProspect.email;
            // Look for First_Name first, then fall back to name, or use empty string
            const name =
              normalizedProspect.first_name || normalizedProspect.name || "";
            const company = normalizedProspect.company || "";

            console.log("Processing prospect:", {
              email,
              name,
              company,
              original: prospect,
            });

            if (!email) {
              console.error("Email missing for prospect:", prospect);
              results.push({
                email: "Unknown",
                status: "Failed",
                message: "Email address missing",
              });
              continue;
            }

            // Personalize the subject and body with the prospect's information
            const personalizedSubject = subject.replace(
              /{{Company}}/gi,
              company
            );
            const personalizedBody = body
              .replace(/{{name}}/gi, name)
              .replace(/{{Company}}/gi, company);

            try {
              await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: personalizedSubject,
                text: personalizedBody,
                html: personalizedBody.replace(/\n/g, "<br>"),
                attachments: attachments,
              });

              results.push({
                email,
                status: "Success",
                message: "Email sent successfully",
              });
            } catch (error) {
              results.push({ email, status: "Failed", message: error.message });
            }
          }

          // Remove attachment file after all emails are sent
          if (attachmentFile) {
            fs.unlinkSync(attachmentFile.path);
          }

          return res.json({ success: true, results });
        });
    } catch (error) {
      console.error("Error sending emails:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// API endpoint to send a single email
app.post(
  "/api/send-single-email",
  upload.single("attachment"),
  async (req, res) => {
    // Check if transporter is configured
    const transporterError = checkTransporter(res);
    if (transporterError) return transporterError;

    try {
      const { email, name = "", company = "", subject, body } = req.body;

      if (!email || !subject || !body) {
        return res.status(400).json({
          success: false,
          message: "Email, subject, and body are required",
        });
      }

      // Setup email attachment if file was uploaded
      let attachments = [];
      if (req.file) {
        attachments.push({
          filename: req.file.originalname,
          path: req.file.path,
        });
      }

      // Personalize the subject and body with the recipient's information
      const personalizedSubject = subject.replace(/{{Company}}/gi, company);
      const personalizedBody = body
        .replace(/{{name}}/gi, name)
        .replace(/{{Company}}/gi, company);

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: personalizedSubject,
          text: personalizedBody,
          html: personalizedBody.replace(/\n/g, "<br>"),
          attachments: attachments,
        });

        // Remove temporary file if it exists
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }

        return res.json({
          success: true,
          result: {
            email,
            status: "Success",
            message: "Email sent successfully",
          },
        });
      } catch (error) {
        // Remove temporary file if it exists
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }

        console.error("Error sending email:", error);
        return res.status(500).json({
          success: false,
          result: {
            email,
            status: "Failed",
            message: error.message,
          },
        });
      }
    } catch (error) {
      // Remove temporary file if it exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      console.error("Error processing request:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
