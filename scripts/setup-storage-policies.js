// Script to set up storage policies in Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import chalk from 'chalk';

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

// List of required buckets
const REQUIRED_BUCKETS = ['meme-images', 'user-avatars'];

async function setupStoragePolicies() {
  console.log(chalk.blue('Setting up Supabase storage policies...'));

  try {
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'create-storage-policies.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL script to create the functions
    console.log(chalk.yellow('Creating storage policy functions...'));
    
    // Try to execute the SQL directly
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (sqlError) {
      console.error(chalk.red('Error creating storage policy functions:'), sqlError);
      
      // If the exec_sql function doesn't exist, try direct SQL execution
      console.log(chalk.yellow('Trying direct SQL execution...'));
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            query: sqlScript
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(chalk.red('Direct SQL execution failed:'), errorText);
          return false;
        }
        
        console.log(chalk.green('Direct SQL execution successful'));
      } catch (directError) {
        console.error(chalk.red('Error with direct SQL execution:'), directError);
        return false;
      }
    } else {
      console.log(chalk.green('Storage policy functions created successfully'));
    }
    
    // Initialize each bucket with the new function
    for (const bucketName of REQUIRED_BUCKETS) {
      console.log(chalk.yellow(`Initializing bucket: ${bucketName}`));
      
      // Call the initialize_storage_bucket function
      const { data, error } = await supabase.rpc('initialize_storage_bucket', {
        bucket_name: bucketName,
        is_public: true
      });
      
      if (error) {
        console.error(chalk.red(`Error initializing bucket ${bucketName}:`), error);
        
        // Try to create the bucket directly if the function fails
        console.log(chalk.yellow(`Trying direct bucket creation for ${bucketName}...`));
        
        // Check if bucket exists
        const { error: getBucketError } = await supabase.storage.getBucket(bucketName);
        
        if (getBucketError && getBucketError.message.includes('not found')) {
          // Create the bucket
          const { error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
          });
          
          if (createError) {
            console.error(chalk.red(`Error creating bucket ${bucketName}:`), createError);
          } else {
            console.log(chalk.green(`Successfully created bucket: ${bucketName}`));
            
            // Create policies manually
            const { error: policyError } = await supabase.rpc('create_storage_policies', {
              bucket_name: bucketName
            });
            
            if (policyError) {
              console.warn(chalk.yellow(`Warning: Could not create policies for bucket ${bucketName}:`), policyError);
            } else {
              console.log(chalk.green(`Storage policies created for bucket: ${bucketName}`));
            }
          }
        } else if (getBucketError) {
          console.error(chalk.red(`Error checking bucket ${bucketName}:`), getBucketError);
        } else {
          console.log(chalk.green(`Bucket already exists: ${bucketName}`));
          
          // Create policies for existing bucket
          const { error: policyError } = await supabase.rpc('create_storage_policies', {
            bucket_name: bucketName
          });
          
          if (policyError) {
            console.warn(chalk.yellow(`Warning: Could not create policies for bucket ${bucketName}:`), policyError);
          } else {
            console.log(chalk.green(`Storage policies created for bucket: ${bucketName}`));
          }
        }
      } else {
        console.log(chalk.green(`Successfully initialized bucket: ${bucketName}`));
      }
    }
    
    console.log(chalk.blue('Storage policy setup complete'));
    return true;
  } catch (error) {
    console.error(chalk.red('Unexpected error:'), error);
    return false;
  }
}

// Run the setup
setupStoragePolicies()
  .then((success) => {
    if (success) {
      console.log(chalk.green('Storage policies setup completed successfully'));
    } else {
      console.log(chalk.yellow('Storage policies setup had some issues - check the logs'));
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error(chalk.red('Error during storage policies setup:'), error);
    process.exit(1);
  });