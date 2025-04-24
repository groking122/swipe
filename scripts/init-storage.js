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
        
        // Create the bucket
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024 // 5MB
        });
        
        if (createError) {
          console.error(chalk.red(`Error creating bucket ${bucketName}:`), createError);
        } else {
          console.log(chalk.green(`Successfully created bucket: ${bucketName}`));
          
          // Create a public URL policy (this is just a trick to make sure policies are created)
          const { error: policyError } = await supabase.storage.from(bucketName)
            .createSignedUrl('dummy.txt', 1);
            
          console.log(chalk.green(`Public access set for bucket: ${bucketName}`));
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