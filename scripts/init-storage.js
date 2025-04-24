// Script to initialize Supabase storage buckets
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(chalk.red('Missing Supabase environment variables'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// List of required buckets
const REQUIRED_BUCKETS = ['meme-images', 'user-avatars'];

// Initialize buckets
async function initBuckets() {
  console.log(chalk.blue('Initializing Supabase storage buckets...'));

  for (const bucketName of REQUIRED_BUCKETS) {
    try {
      console.log(chalk.yellow(`Checking bucket: ${bucketName}`));
      
      // Check if bucket exists
      const { data, error } = await supabase.storage.getBucket(bucketName);
      
      if (error && error.message.includes('not found')) {
        console.log(chalk.yellow(`Creating bucket: ${bucketName}`));
        
        // Create the bucket with proper RLS policies
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        });
        
        if (createError) {
          console.error(chalk.red(`Error creating bucket ${bucketName}:`), createError);
        } else {
          console.log(chalk.green(`Successfully created bucket: ${bucketName}`));
          
          // Create explicit RLS policies for the bucket
          try {
            // First try to create a signed URL to trigger policy creation
            const { error: policyError } = await supabase.storage.from(bucketName)
              .createSignedUrl('dummy.txt', 60);
            
            if (policyError && !policyError.message.includes('not found')) {
              console.warn(chalk.yellow(`Warning: Could not create signed URL for bucket ${bucketName}:`), policyError);
            }
            
            // Explicitly create RLS policies using SQL
            const { error: sqlError } = await supabase.rpc('create_storage_policies', {
              bucket_name: bucketName
            });
            
            if (sqlError) {
              console.warn(chalk.yellow(`Warning: Could not create explicit policies for bucket ${bucketName}:`), sqlError);
            } else {
              console.log(chalk.green(`Storage policies created for bucket: ${bucketName}`));
            }
            
            console.log(chalk.green(`Public access set for bucket: ${bucketName}`));
          } catch (policyError) {
            console.warn(chalk.yellow(`Warning: Error setting up policies for bucket ${bucketName}:`), policyError);
          }
        }
      } else if (error) {
        console.error(chalk.red(`Error checking bucket ${bucketName}:`), error);
      } else {
        console.log(chalk.green(`Bucket already exists: ${bucketName}`));
      }
    } catch (error) {
      console.error(chalk.red(`Unexpected error with bucket ${bucketName}:`), error);
    }
  }

  console.log(chalk.blue('Storage initialization complete'));
}

// Run the initialization
initBuckets()
  .then(() => {
    console.log(chalk.green('Storage setup completed successfully'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('Error during storage setup:'), error);
    process.exit(1);
  }); 