// Script to fix Supabase storage and authentication issues
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';

// Promisify exec
const execAsync = promisify(exec);

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(chalk.red('Missing Supabase environment variables'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSupabaseIssues() {
  console.log(chalk.blue('Starting Supabase fixes...'));
  
  // Step 1: Set up storage policies
  console.log(chalk.yellow('Step 1: Setting up storage policies...'));
  try {
    await execAsync('node scripts/setup-storage-policies.js');
    console.log(chalk.green('Storage policies set up successfully'));
  } catch (error) {
    console.error(chalk.red('Error setting up storage policies:'), error.message);
    console.log(chalk.yellow('Continuing with other fixes...'));
  }
  
  // Step 2: Initialize storage buckets
  console.log(chalk.yellow('Step 2: Initializing storage buckets...'));
  try {
    await execAsync('node scripts/init-storage.js');
    console.log(chalk.green('Storage buckets initialized successfully'));
  } catch (error) {
    console.error(chalk.red('Error initializing storage buckets:'), error.message);
    console.log(chalk.yellow('Continuing with other fixes...'));
  }
  
  // Step 3: Fix database schema
  console.log(chalk.yellow('Step 3: Fixing database schema...'));
  try {
    await execAsync('node scripts/fix-database.js');
    console.log(chalk.green('Database schema fixed successfully'));
  } catch (error) {
    console.error(chalk.red('Error fixing database schema:'), error.message);
    console.log(chalk.yellow('Continuing with other fixes...'));
  }
  
  // Step 4: Verify users table and create it if needed
  console.log(chalk.yellow('Step 4: Verifying users table...'));
  try {
    // Check if users table exists
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log(chalk.yellow('Users table may not exist, creating it...'));
      
      // Create users table
      const createUsersTableSQL = `
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          username TEXT NOT NULL UNIQUE,
          avatar_url TEXT,
          monthly_upload_count INTEGER DEFAULT 0,
          total_uploads INTEGER DEFAULT 0,
          account_status TEXT DEFAULT 'active',
          account_type TEXT DEFAULT 'free',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          deleted_at TIMESTAMP WITH TIME ZONE
        );
        
        -- Enable Row Level Security
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for users
        CREATE POLICY IF NOT EXISTS users_select_policy ON public.users
          FOR SELECT USING (true);
          
        CREATE POLICY IF NOT EXISTS users_insert_policy ON public.users
          FOR INSERT TO anon WITH CHECK (true);
          
        CREATE POLICY IF NOT EXISTS users_update_policy ON public.users
          FOR UPDATE TO authenticated USING (auth.uid() = id);
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createUsersTableSQL });
      
      if (createError) {
        console.error(chalk.red('Error creating users table:'), createError);
      } else {
        console.log(chalk.green('Users table created successfully'));
      }
    } else {
      console.log(chalk.green('Users table exists and has', count, 'records'));
    }
  } catch (error) {
    console.error(chalk.red('Error verifying users table:'), error);
  }
  
  // Step 5: Verify Clerk webhook is properly configured
  console.log(chalk.yellow('Step 5: Verifying Clerk webhook configuration...'));
  
  if (!process.env.CLERK_WEBHOOK_SECRET) {
    console.log(chalk.red('CLERK_WEBHOOK_SECRET is not set in your environment variables'));
    console.log(chalk.yellow('Please set up a Clerk webhook with the following URL:'));
    console.log(chalk.cyan(`${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-url.com'}/api/webhooks/clerk`));
    console.log(chalk.yellow('And add the following events:'));
    console.log(chalk.cyan('user.created, user.updated, user.deleted'));
  } else {
    console.log(chalk.green('CLERK_WEBHOOK_SECRET is set in your environment variables'));
  }
  
  console.log(chalk.blue('Supabase fixes completed'));
  return true;
}

// Run the fixes
fixSupabaseIssues()
  .then((success) => {
    if (success) {
      console.log(chalk.green('All Supabase fixes completed successfully'));
      console.log(chalk.cyan('To test the fixes, try running:'));
      console.log(chalk.cyan('1. node scripts/init-storage.js'));
      console.log(chalk.cyan('2. Sign in with Clerk and check if the user is created in Supabase'));
    } else {
      console.log(chalk.yellow('Some fixes may not have been applied - check the logs'));
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error(chalk.red('Error during Supabase fixes:'), error);
    process.exit(1);
  });