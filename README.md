# Email Automator

A simple web application that allows you to send personalized emails to multiple recipients in one click.

## Features

- Upload a CSV file with a list of prospects
- Create a personalized email subject and body
- Send emails to all prospects in one click
- View detailed results of the email sending process
- Personalize emails using recipient names with {{name}} placeholder

## Setup

1. Clone the repository:

   ```
   git clone <repository-url>
   cd email-automator
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:

   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   PORT=3000
   ```

   **Note:** For Gmail, you need to use an "App Password" instead of your regular password. See [Google's documentation](https://support.google.com/accounts/answer/185833) on how to generate an App Password.

4. Start the application:

   ```
   npm start
   ```

   For development mode with auto-restart:

   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## CSV Format

The CSV file should have at least an `email` column. You can also include a `name` column for personalization:

```
name,email
John Doe,johndoe@example.com
Jane Smith,janesmith@example.com
```

## How to Use

1. Upload your CSV file with prospects
2. Enter the email subject
3. Write your email body (use {{name}} to include the recipient's name)
4. Click "Send Emails"
5. View the results

## Technologies Used

- Node.js
- Express.js
- Nodemailer
- Bootstrap
- CSV Parser
