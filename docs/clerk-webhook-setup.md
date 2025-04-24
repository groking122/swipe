# Clerk Webhook Setup Guide

This guide will help you properly configure the Clerk webhook to sync user data with your Supabase database.

## Overview

When users sign up, update their profiles, or delete their accounts in Clerk, we need to sync this data to our Supabase database. This is done through a webhook that Clerk sends to our application.

## Prerequisites

- A Clerk account and application set up
- A Supabase account and project set up
- Your application deployed (or using a service like ngrok for local development)

## Step 1: Set Up the Webhook Endpoint in Clerk

1. Log in to your [Clerk Dashboard](https://dashboard.clerk.dev/)
2. Select your application
3. In the left sidebar, click on **Webhooks**
4. Click the **Add Endpoint** button

## Step 2: Configure the Webhook

1. Enter your webhook URL:
   ```
   https://your-app-domain.com/api/webhooks/clerk
   ```
   Replace `your-app-domain.com` with your actual domain.

2. For local development, you can use ngrok to create a tunnel:
   ```
   ngrok http 3000
   ```
   Then use the ngrok URL in your webhook configuration:
   ```
   https://your-ngrok-url.ngrok.io/api/webhooks/clerk
   ```

3. Under "Events to send", select the following events:
   - `user.created`
   - `user.updated`
   - `user.deleted`

4. Click **Create** to save the webhook configuration

## Step 3: Get the Webhook Secret

1. After creating the webhook, Clerk will generate a signing secret
2. Copy this secret - you'll need it for your environment variables

## Step 4: Add the Webhook Secret to Environment Variables

1. Add the following line to your `.env.local` file:
   ```
   CLERK_WEBHOOK_SECRET=your_webhook_secret_here
   ```
   Replace `your_webhook_secret_here` with the secret you copied from Clerk

2. If you're deploying to Vercel or another hosting platform, add this environment variable to your project settings

## Step 5: Verify the Webhook Handler Code

The webhook handler is already set up at `memeswipe/src/app/api/webhooks/clerk/route.ts`. This handler:

1. Verifies the webhook signature using the secret
2. Processes the webhook payload
3. Creates or updates users in Supabase based on the event type

## Step 6: Test the Webhook

You can test the webhook by:

1. Creating a new user in Clerk
2. Updating a user's profile
3. Deleting a user

Check your Supabase database to verify that the changes are reflected:

```sql
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;
```

## Step 7: Monitor Webhook Activity

1. In the Clerk Dashboard, go to the Webhooks section
2. Click on your webhook endpoint
3. You can see recent webhook deliveries and their status
4. If there are any failures, you can view the details and retry the webhook

## Troubleshooting

If your webhook isn't working as expected:

1. Check the logs in your application for any errors
2. Verify that the `CLERK_WEBHOOK_SECRET` is correctly set in your environment variables
3. Make sure your webhook URL is accessible from the internet
4. Check that the webhook handler in `memeswipe/src/app/api/webhooks/clerk/route.ts` is correctly processing the events

### Common Issues

#### User IDs Not Being Synced Correctly

Clerk user IDs can come in two formats:
- With a `user_` prefix (e.g., `user_2w8heKv4AFo0N9Qffw1ecufGYru`)
- Without a prefix (e.g., `2w8heKv4AFo0N9Qffw1ecufGYru`)

Our code handles both formats, but if you're seeing issues, check the logs for any errors related to user ID processing.

#### Webhook Signature Verification Failing

If you see errors about invalid webhook signatures, make sure:
- The `CLERK_WEBHOOK_SECRET` environment variable is set correctly
- You're using the correct secret for the webhook endpoint
- The webhook request is not being modified in transit (e.g., by a proxy)

#### Users Not Being Created in Supabase

If users are not being created in Supabase:
- Check if the Supabase environment variables are set correctly
- Verify that the `users` table exists in your Supabase database
- Look for any errors in the webhook handler logs

## Testing Script

We've included a script to test the webhook functionality:

```bash
node scripts/test-clerk-webhook.js
```

This script will:
1. Simulate Clerk webhook events
2. Check if users are being created in Supabase
3. Log any errors or issues

## Additional Resources

- [Clerk Webhook Documentation](https://clerk.dev/docs/webhooks/overview)
- [Supabase JavaScript Client Documentation](https://supabase.io/docs/reference/javascript/start)