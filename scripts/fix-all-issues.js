// This script runs all the fix scripts in the correct order to resolve issues with the app
// Run this script with: node scripts/fix-all-issues.js

import { execSync } from 'child_process';
import chalk from 'chalk';

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
  
  console.log(chalk.blue('Step 3: Fixing Supabase issues...'));
  runScript('fix-supabase-issues', 'Fix Supabase storage and authentication issues');
  
  console.log(chalk.blue('Step 4: Setting up storage policies...'));
  runScript('setup-storage-policies', 'Set up Supabase storage policies');
  
  console.log(chalk.blue('Step 5: Initializing storage...'));
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