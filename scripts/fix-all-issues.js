// This script runs all the fix scripts in the correct order to resolve issues with the app
// Run this script with: node scripts/fix-all-issues.js

import { execSync } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

console.log(chalk.blue('=== MemeSwipe Issue Fixer ==='));
console.log(chalk.yellow('This script will run all fix scripts to resolve issues with the app.'));
console.log(chalk.yellow('Make sure you have a backup of your project before running this script.'));
console.log('');

// Function to run a script and handle errors
function runScript(scriptName, description) {
  console.log(chalk.blue(`Running ${scriptName}: ${description}...`));
  
  try {
    execSync(`node scripts/${scriptName}.js`, { stdio: 'inherit' });
    console.log(chalk.green(`✓ ${scriptName} completed successfully!`));
    return true;
  } catch (error) {
    console.error(chalk.red(`✗ ${scriptName} failed with error:`));
    console.error(chalk.red(error.message));
    return false;
  }
}

// Run the scripts in order
async function runAllScripts() {
  console.log(chalk.blue('Step 1: Fixing environment variables...'));
  const envFixed = runScript('fix-env-issues', 'Check and fix environment variables');
  
  if (!envFixed) {
    console.log(chalk.yellow('Environment variable issues must be fixed before continuing.'));
    console.log(chalk.yellow('Please fix the issues and run this script again.'));
    process.exit(1);
  }
  
  console.log(chalk.blue('Step 2: Fixing Button component issues...'));
  runScript('fix-button-issue', 'Fix Button component case sensitivity issues');
  
  console.log(chalk.blue('Step 3: Fixing middleware conflicts...'));
  try {
    console.log(chalk.yellow('Checking for middleware conflicts...'));
    
    const middlewarePath = path.resolve('src/middleware.ts');
    const middlewareUserSyncPath = path.resolve('src/middleware-user-sync.ts');
    
    const middlewareExists = fs.existsSync(middlewarePath);
    const middlewareUserSyncExists = fs.existsSync(middlewareUserSyncPath);
    
    if (middlewareExists && middlewareUserSyncExists) {
      console.log(chalk.yellow('Found both middleware.ts and middleware-user-sync.ts files.'));
      console.log(chalk.yellow('This can cause conflicts. Backing up middleware-user-sync.ts...'));
      
      // Backup the middleware-user-sync.ts file
      const backupPath = path.resolve('src/middleware-user-sync.ts.bak');
      fs.copyFileSync(middlewareUserSyncPath, backupPath);
      
      console.log(chalk.green('Backed up middleware-user-sync.ts to middleware-user-sync.ts.bak'));
      console.log(chalk.yellow('Please check that middleware.ts includes all necessary functionality.'));
      console.log(chalk.yellow('You may need to manually combine the two middleware files.'));
    } else if (!middlewareExists && middlewareUserSyncExists) {
      console.log(chalk.yellow('Found only middleware-user-sync.ts but not middleware.ts.'));
      console.log(chalk.yellow('Renaming middleware-user-sync.ts to middleware.ts...'));
      
      // Rename middleware-user-sync.ts to middleware.ts
      fs.copyFileSync(middlewareUserSyncPath, middlewarePath);
      fs.renameSync(middlewareUserSyncPath, middlewareUserSyncPath + '.bak');
      
      console.log(chalk.green('Renamed middleware-user-sync.ts to middleware.ts'));
    } else if (middlewareExists && !middlewareUserSyncExists) {
      console.log(chalk.green('Only middleware.ts exists. No conflicts detected.'));
    } else {
      console.log(chalk.red('No middleware files found. This may cause authentication issues.'));
    }
  } catch (error) {
    console.error(chalk.red('Error fixing middleware conflicts:'), error.message);
  }
  
  console.log(chalk.blue('Step 4: Fixing Supabase issues...'));
  runScript('fix-supabase-issues', 'Fix Supabase storage and authentication issues');
  
  console.log(chalk.blue('Step 5: Setting up storage policies...'));
  runScript('setup-storage-policies', 'Set up Supabase storage policies');
  
  console.log(chalk.blue('Step 6: Initializing storage...'));
  runScript('init-storage', 'Initialize Supabase storage buckets');
  
  console.log('');
  console.log(chalk.green('=== All fix scripts have been run! ==='));
  console.log(chalk.yellow('To test if the issues are fixed, run:'));
  console.log(chalk.cyan('npm run dev'));
  console.log(chalk.yellow('Then open your browser to http://localhost:3000'));
  console.log('');
  console.log(chalk.yellow('If you still encounter issues, please check the console for error messages.'));
}

// Run all scripts
runAllScripts();