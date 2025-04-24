// Script to test the Clerk webhook functionality
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';
import fetch from 'node-fetch';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(chalk.red('Missing Supabase environment variables'));
  process.exit(1);
}

if (!webhookSecret) {
  console.error(chalk.red('Missing CLERK_WEBHOOK_SECRET environment variable'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to generate a webhook signature
function generateSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payloadString = JSON.stringify(payload);
  
  const toSign = `${timestamp}.${payloadString}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(toSign)
    .digest('hex');
  
  return {
    'svix-id': crypto.randomUUID(),
    'svix-timestamp': timestamp,
    'svix-signature': `v1,${signature}`
  };
}

// Function to simulate a Clerk webhook event
async function simulateWebhook(eventType, userData) {
  const webhookUrl = `${appUrl}/api/webhooks/clerk`;
  
  // Create webhook payload
  const payload = {
    type: eventType,
    data: userData
  };
  
  // Generate webhook signature
  const headers = generateSignature(payload, webhookSecret);
  
  console.log(chalk.blue(`Simulating ${eventType} webhook to ${webhookUrl}`));
  console.log(chalk.yellow('Webhook payload:'), payload);
  
  try {
    // Send webhook request
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(payload)
    });
    
    const responseData = await response.json();
    
    if (response.ok) {
      console.log(chalk.green('Webhook simulation successful:'), responseData);
      return true;
    } else {
      console.error(chalk.red('Webhook simulation failed:'), responseData);
      return false;
    }
  } catch (error) {
    console.error(chalk.red('Error sending webhook:'), error);
    return false;
  }
}

// Function to check if a user exists in Supabase
async function checkUserInSupabase(userId) {
  console.log(chalk.blue(`Checking if user ${userId} exists in Supabase...`));
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      if (error.message.includes('No rows found')) {
        console.log(chalk.yellow(`User ${userId} not found in Supabase`));
      } else {
        console.error(chalk.red('Error checking user:'), error);
      }
      return null;
    }
    
    console.log(chalk.green(`User found in Supabase:`), data);
    return data;
  } catch (error) {
    console.error(chalk.red('Error checking user:'), error);
    return null;
  }
}

// Main function to test the webhook
async function testWebhook() {
  console.log(chalk.blue('Starting Clerk webhook test...'));
  
  // Test user data
  const testUserId = `test_${Date.now()}`;
  const testUserEmail = `test_${Date.now()}@example.com`;
  const testUserName = `testuser_${Date.now()}`;
  
  // Test user data with and without 'user_' prefix
  const testUsers = [
    {
      id: testUserId,
      email_addresses: [{ email_address: testUserEmail }],
      username: testUserName,
      first_name: 'Test',
      last_name: 'User'
    },
    {
      id: `user_${testUserId}`,
      email_addresses: [{ email_address: `user_${testUserEmail}` }],
      username: `user_${testUserName}`,
      first_name: 'Test',
      last_name: 'User With Prefix'
    }
  ];
  
  for (const testUser of testUsers) {
    console.log(chalk.blue(`Testing with user ID: ${testUser.id}`));
    
    // Simulate user.created webhook
    const success = await simulateWebhook('user.created', testUser);
    
    if (success) {
      // Check if user was created in Supabase
      // For IDs with 'user_' prefix, we need to remove it
      const dbUserId = testUser.id.startsWith('user_') 
        ? testUser.id.replace('user_', '') 
        : testUser.id;
      
      await checkUserInSupabase(dbUserId);
    }
  }
  
  console.log(chalk.blue('Webhook test completed'));
}

// Run the test
testWebhook()
  .then(() => {
    console.log(chalk.green('Webhook test completed'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('Error during webhook test:'), error);
    process.exit(1);
  });