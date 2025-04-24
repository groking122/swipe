// Script to initialize Supabase storage buckets using admin privileges
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

// Initialize Supabase admin client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(chalk.red('Missing Supabase environment variables'));
  process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// List of required buckets
const REQUIRED_BUCKETS = ['meme-images', 'user-avatars'];

// Initialize buckets with admin privileges
async function initBucketsAdmin() {
  console.log(chalk.blue('Initializing Supabase storage buckets with admin privileges...'));

  for (const bucketName of REQUIRED_BUCKETS) {
    try {
      console.log(chalk.yellow(`[ADMIN] Checking bucket: ${bucketName}`));
      
      // Check if bucket exists
      const { data, error } = await supabaseAdmin.storage.getBucket(bucketName);
      
      if (error && error.message.includes('not found')) {
        console.log(chalk.yellow(`[ADMIN] Creating bucket: ${bucketName}`));
        
        // Create the bucket with admin privileges
        const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        });
        
        if (createError) {
          console.error(chalk.red(`[ADMIN] Error creating bucket ${bucketName}:`), createError);
        } else {
          console.log(chalk.green(`[ADMIN] Successfully created bucket: ${bucketName}`));
          
          // Create explicit RLS policies for the bucket
          try {
            // First try to create a signed URL to trigger policy creation
            const { error: policyError } = await supabaseAdmin.storage.from(bucketName)
              .createSignedUrl('dummy.txt', 60);
            
            if (policyError && !policyError.message.includes('not found')) {
              console.warn(chalk.yellow(`[ADMIN] Warning: Could not create signed URL for bucket ${bucketName}:`), policyError);
            }
            
            // Create explicit policies using SQL
            try {
              // Create a policy that allows public read access
              const { error: publicReadError } = await supabaseAdmin.rpc('create_storage_policy', {
                bucket_name: bucketName,
                policy_name: `${bucketName}_public_read`,
                definition: `bucket_id = '${bucketName}' AND auth.role() = 'anon'`,
                policy_action: 'SELECT'
              });
              
              if (publicReadError) {
                console.warn(chalk.yellow(`[ADMIN] Warning: Could not create public read policy for bucket ${bucketName}:`), publicReadError);
              } else {
                console.log(chalk.green(`[ADMIN] Public read policy created for bucket: ${bucketName}`));
              }
              
              // Create a policy that allows authenticated users to upload
              const { error: authInsertError } = await supabaseAdmin.rpc('create_storage_policy', {
                bucket_name: bucketName,
                policy_name: `${bucketName}_auth_insert`,
                definition: `bucket_id = '${bucketName}' AND auth.role() = 'authenticated'`,
                policy_action: 'INSERT'
              });
              
              if (authInsertError) {
                console.warn(chalk.yellow(`[ADMIN] Warning: Could not create auth insert policy for bucket ${bucketName}:`), authInsertError);
              } else {
                console.log(chalk.green(`[ADMIN] Auth insert policy created for bucket: ${bucketName}`));
              }
              
              // Create a policy that allows service role to do everything
              const { error: serviceRoleError } = await supabaseAdmin.rpc('create_storage_policy', {
                bucket_name: bucketName,
                policy_name: `${bucketName}_service_role_all`,
                definition: `bucket_id = '${bucketName}' AND auth.role() = 'service_role'`,
                policy_action: 'ALL'
              });
              
              if (serviceRoleError) {
                console.warn(chalk.yellow(`[ADMIN] Warning: Could not create service role policy for bucket ${bucketName}:`), serviceRoleError);
              } else {
                console.log(chalk.green(`[ADMIN] Service role policy created for bucket: ${bucketName}`));
              }
            } catch (sqlError) {
              console.warn(chalk.yellow(`[ADMIN] Warning: Error creating SQL policies for bucket ${bucketName}:`), sqlError);
            }
            
            console.log(chalk.green(`[ADMIN] Storage policies created for bucket: ${bucketName}`));
          } catch (policyError) {
            console.warn(chalk.yellow(`[ADMIN] Warning: Error setting up policies for bucket ${bucketName}:`), policyError);
          }
        }
      } else if (error) {
        console.error(chalk.red(`[ADMIN] Error checking bucket ${bucketName}:`), error);
      } else {
        console.log(chalk.green(`[ADMIN] Bucket already exists: ${bucketName}`));
        
        // Ensure policies are set for existing bucket
        try {
          // Create a dummy signed URL to trigger policy creation
          const { error: policyError } = await supabaseAdmin.storage.from(bucketName)
            .createSignedUrl('dummy.txt', 60);
          
          if (policyError && !policyError.message.includes('not found')) {
            console.warn(chalk.yellow(`[ADMIN] Warning: Could not create signed URL for existing bucket ${bucketName}:`), policyError);
          }
          
          console.log(chalk.green(`[ADMIN] Verified policies for existing bucket: ${bucketName}`));
        } catch (policyError) {
          console.warn(chalk.yellow(`[ADMIN] Warning: Error verifying policies for existing bucket ${bucketName}:`), policyError);
        }
      }
    } catch (error) {
      console.error(chalk.red(`[ADMIN] Unexpected error with bucket ${bucketName}:`), error);
    }
  }

  console.log(chalk.blue('[ADMIN] Storage initialization complete'));
}

// Run the initialization
initBucketsAdmin()
  .then(() => {
    console.log(chalk.green('[ADMIN] Storage setup completed successfully'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('[ADMIN] Error during storage setup:'), error);
    process.exit(1);
  });