# Setting Up OAuth2 for Gmail Integration

This guide will help you set up OAuth2 authentication for the Email Automator application to work with Gmail.

## Why OAuth2 instead of App Passwords?

OAuth2 is more secure than using App Passwords because:

- It doesn't require storing your password
- It provides limited access to only what's needed
- It can be revoked without affecting your account password
- It's the recommended approach for accessing Google APIs

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Give your project a name (e.g., "Email Automator")

## Step 2: Set Up OAuth Consent Screen

1. In your project, go to **APIs & Services** > **OAuth consent screen**
2. Select **External** as the user type (fine for testing)
3. Enter the required information:
   - App name (e.g., "Email Automator")
   - User support email (your email)
   - Developer contact information (your email)
4. Click **Save and Continue**
5. Add the scope: `https://mail.google.com/`
6. Click **Save and Continue**
7. Add any test users (email addresses that will use the app)
8. Click **Save and Continue** to complete the setup

## Step 3: Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application** as the application type
4. Give it a name (e.g., "Email Automator Web Client")
5. Add authorized redirect URIs:
   - For development: `http://localhost:3000/oauth2callback`
   - For production: Add your production URL
6. Click **Create**
7. Take note of your **Client ID** and **Client Secret**

## Step 4: Generate a Refresh Token

1. Go to the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in the upper right corner
3. Check the box "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret from Step 3
5. Close the settings dialog
6. In the left panel, scroll down and select "Gmail API v1" and check `https://mail.google.com/`
7. Click **Authorize APIs**
8. Sign in with the Google account you want to use for sending emails
9. Click **Allow** to grant access
10. In the next screen, click **Exchange authorization code for tokens**
11. Note the **Refresh token** that appears in the response

## Step 5: Update Your Environment Variables

Add the following to your `.env` file:

```
EMAIL_SERVICE=gmail
EMAIL_USER=your_gmail_address@gmail.com
OAUTH_CLIENT_ID=your_client_id_from_step_3
OAUTH_CLIENT_SECRET=your_client_secret_from_step_3
OAUTH_REFRESH_TOKEN=your_refresh_token_from_step_4
```

The access token field is optional as it will be automatically refreshed using the refresh token.

## Troubleshooting

### "Invalid Grant" Error

If you see an "invalid grant" error, your refresh token may have expired. Refresh tokens can expire if:

- They haven't been used for 6 months
- The user changed their password
- The user revoked access

Solution: Repeat Step 4 to generate a new refresh token.

### "Invalid Credentials" Error

Double-check that you've correctly copied all credentials to your `.env` file without any typos or extra spaces.

### Gmail Blocking Access

If Gmail is blocking the app:

1. Check your Gmail inbox for security alerts
2. Confirm that it's you trying to access your account
3. Follow the steps to allow access from "less secure app"
