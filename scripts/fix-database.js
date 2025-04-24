// Script to fix database schema issues
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
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

async function fixDatabase() {
  try {
    console.log(chalk.blue('Starting database schema fix...'));

    // Read the SQL script
    const sqlScriptPath = path.join(process.cwd(), 'scripts', 'supabase-setup.sql');
    const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');

    // Execute the SQL script
    console.log(chalk.yellow('Executing SQL setup script...'));
    const { error } = await supabase.rpc('exec_sql', { sql: sqlScript });

    if (error) {
      console.error(chalk.red('Error executing SQL script:'), error);
      
      // Try direct SQL execution
      const directSuccess = await executeDirectSQL(sqlScript);
      if (directSuccess) {
        console.log(chalk.green('SQL executed successfully via direct method'));
        return true;
      }
      
      // Attempt alternative approach with RPC call
      console.log(chalk.yellow('Trying alternative fix with direct column rename...'));
      const { error: rpcError } = await supabase.rpc('fix_meme_image_columns');
      
      if (rpcError) {
        console.error(chalk.red('Error with alternative fix:'), rpcError);
        
        // Create a simplified SQL script with just the essential column fix
        const simplifiedSQL = `
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'memes' 
              AND column_name = 'image_url'
            ) AND NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'memes' 
              AND column_name = 'image_path'
            ) THEN
              ALTER TABLE public.memes RENAME COLUMN image_url TO image_path;
            ELSIF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'memes' 
              AND column_name = 'image_path'
            ) THEN
              ALTER TABLE public.memes ADD COLUMN image_path TEXT;
            END IF;
          END
          $$;
        `;
        
        // Try direct SQL with simplified script
        const simplifiedSuccess = await executeDirectSQL(simplifiedSQL);
        if (simplifiedSuccess) {
          console.log(chalk.green('Simplified SQL fix executed successfully'));
          return true;
        }
        
        // Manual SQL approach
        console.log(chalk.yellow('Attempting manual SQL fix...'));
        
        // Check if image_url column exists
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'memes');
          
        if (columnsError) {
          console.error(chalk.red('Error checking columns:'), columnsError);
          return false;
        }
        
        const hasImageUrl = columns.some(col => col.column_name === 'image_url');
        const hasImagePath = columns.some(col => col.column_name === 'image_path');
        
        if (hasImageUrl && !hasImagePath) {
          // Rename the column
          console.log(chalk.yellow('Renaming image_url to image_path...'));
          const { error: renameError } = await supabase.rpc('exec_sql', { 
            sql: 'ALTER TABLE public.memes RENAME COLUMN image_url TO image_path;' 
          });
          
          if (renameError) {
            console.error(chalk.red('Error renaming column:'), renameError);
            
            // Try direct SQL for rename
            const renameSuccess = await executeDirectSQL('ALTER TABLE public.memes RENAME COLUMN image_url TO image_path;');
            if (!renameSuccess) {
              return false;
            }
          }
          
          console.log(chalk.green('Column renamed successfully!'));
        } else if (!hasImagePath) {
          // Add image_path column
          console.log(chalk.yellow('Adding image_path column...'));
          const { error: addColumnError } = await supabase.rpc('exec_sql', { 
            sql: 'ALTER TABLE public.memes ADD COLUMN image_path TEXT;' 
          });
          
          if (addColumnError) {
            console.error(chalk.red('Error adding column:'), addColumnError);
            
            // Try direct SQL for adding column
            const addSuccess = await executeDirectSQL('ALTER TABLE public.memes ADD COLUMN image_path TEXT;');
            if (!addSuccess) {
              return false;
            }
          }
          
          console.log(chalk.green('Column added successfully!'));
        } else {
          console.log(chalk.green('Column structure looks good - no changes needed'));
        }
      } else {
        console.log(chalk.green('Alternative fix applied successfully!'));
      }
    } else {
      console.log(chalk.green('SQL script executed successfully!'));
    }
    
    console.log(chalk.blue('Database fix complete'));
    return true;
  } catch (error) {
    console.error(chalk.red('Unexpected error:'), error);
    return false;
  }
}

// Try direct SQL execution if RPC methods fail
async function executeDirectSQL(sql) {
  try {
    console.log(chalk.yellow('Executing direct SQL...'));
    // Use REST API to execute SQL directly
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(chalk.red('SQL execution failed:'), errorText);
      return false;
    }

    console.log(chalk.green('Direct SQL executed successfully'));
    return true;
  } catch (error) {
    console.error(chalk.red('Direct SQL execution error:'), error);
    return false;
  }
}

// Run the fix
fixDatabase()
  .then(success => {
    if (success) {
      console.log(chalk.green('Database schema fixed successfully'));
    } else {
      console.log(chalk.yellow('Database schema fix had some issues - check the logs'));
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(chalk.red('Error running database fix:'), error);
    process.exit(1);
  }); 