// This script helps fix environment variable issues by checking and updating the .env file
// Run this script with: node scripts/fix-env-issues.js

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

console.log(chalk.blue('Starting environment variable check...'));

// Path to the .env file
const envPath = path.resolve('.env');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.log(chalk.red('.env file not found. Creating a template...'));
  
  // Create a template .env file
  const templateEnv = `# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
`;
  
  fs.writeFileSync(envPath, templateEnv);
  console.log(chalk.green('Created template .env file. Please fill in your actual values.'));
  process.exit(1);
}

// Read the .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = dotenv.parse(envContent);

// Check for required environment variables
const requiredVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingVars = requiredVars.filter(varName => !envVars[varName]);

if (missingVars.length > 0) {
  console.log(chalk.red('Missing required environment variables:'));
  missingVars.forEach(varName => {
    console.log(chalk.yellow(`- ${varName}`));
  });
  console.log(chalk.yellow('Please add these variables to your .env file.'));
  process.exit(1);
}

// Check if Supabase URL and keys are valid
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(chalk.blue('Testing Supabase connection...'));

// Create Supabase client with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test the connection
async function testSupabaseConnection() {
  try {
    // Try to get the server timestamp
    const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.log(chalk.red('Error connecting to Supabase:'), error.message);
      console.log(chalk.yellow('Please check your Supabase URL and anon key.'));
      return false;
    }
    
    console.log(chalk.green('Successfully connected to Supabase!'));
    return true;
  } catch (error) {
    console.log(chalk.red('Error connecting to Supabase:'), error.message);
    console.log(chalk.yellow('Please check your Supabase URL and anon key.'));
    return false;
  }
}

// Create Supabase admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Test the admin connection
async function testSupabaseAdminConnection() {
  try {
    // Try to get the server timestamp
    const { data, error } = await supabaseAdmin.from('users').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.log(chalk.red('Error connecting to Supabase with service role key:'), error.message);
      console.log(chalk.yellow('Please check your Supabase URL and service role key.'));
      return false;
    }
    
    console.log(chalk.green('Successfully connected to Supabase with service role key!'));
    return true;
  } catch (error) {
    console.log(chalk.red('Error connecting to Supabase with service role key:'), error.message);
    console.log(chalk.yellow('Please check your Supabase URL and service role key.'));
    return false;
  }
}

// Check if Clerk keys are valid
const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

console.log(chalk.blue('Checking Clerk keys...'));

if (!clerkPubKey.startsWith('pk_') || clerkPubKey.length < 20) {
  console.log(chalk.red('Invalid Clerk publishable key format. Should start with "pk_" and be at least 20 characters.'));
  console.log(chalk.yellow('Please check your NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.'));
}

if (!clerkSecretKey.startsWith('sk_') || clerkSecretKey.length < 20) {
  console.log(chalk.red('Invalid Clerk secret key format. Should start with "sk_" and be at least 20 characters.'));
  console.log(chalk.yellow('Please check your CLERK_SECRET_KEY.'));
}

// Run the tests
async function runTests() {
  const supabaseConnected = await testSupabaseConnection();
  const supabaseAdminConnected = await testSupabaseAdminConnection();
  
  if (supabaseConnected && supabaseAdminConnected) {
    console.log(chalk.green('All environment variables are valid and connections are working!'));
    
    // Add Clerk URL variables if they don't exist
    let envUpdated = false;
    const clerkUrls = {
      'NEXT_PUBLIC_CLERK_SIGN_IN_URL': '/sign-in',
      'NEXT_PUBLIC_CLERK_SIGN_UP_URL': '/sign-up',
      'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL': '/',
      'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL': '/'
    };
    
    let updatedEnvContent = envContent;
    
    for (const [key, value] of Object.entries(clerkUrls)) {
      if (!envVars[key]) {
        console.log(chalk.yellow(`Adding missing ${key}=${value} to .env file`));
        updatedEnvContent += `\n${key}=${value}`;
        envUpdated = true;
      }
    }
    
    if (envUpdated) {
      fs.writeFileSync(envPath, updatedEnvContent);
      console.log(chalk.green('Updated .env file with missing Clerk URL variables.'));
    }
    
    console.log(chalk.blue('Environment check completed successfully!'));
  } else {
    console.log(chalk.red('Environment check failed. Please fix the issues above.'));
  }
}

runTests();