# mighty
Created with CodeSandbox

## Setup

### Environment Variables

This project requires a YouTube Data API v3 key to function.

#### Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your YouTube API key to `.env`:
   ```
   REACT_APP_YOUTUBE_API_KEY=your_actual_api_key_here
   ```

3. The `.env` file is already in `.gitignore` and will not be committed.

#### CodeSandbox Setup

For CodeSandbox, you need to set environment variables through their Secret Manager:

1. Open your sandbox
2. Click on the **Server Control Panel** (bottom left)
3. Go to **Env Variables** tab
4. Add a new secret:
   - **Key:** `REACT_APP_YOUTUBE_API_KEY`
   - **Value:** Your YouTube API key
5. Restart the dev server

**Important:** CodeSandbox secrets are stored securely and won't be exposed in your public sandbox or forks.

#### Getting a YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **YouTube Data API v3**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key and add it to your `.env` file or CodeSandbox secrets

**Security Note:** Never commit your API key to version control. Always use environment variables.
