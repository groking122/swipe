// This script helps fix the Button component issue by ensuring consistent imports
// Run this script with: node scripts/fix-button-issue.js

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

console.log(chalk.blue('Starting Button component fix...'));

// Path to the components directory
const componentsDir = path.resolve('src/components/ui');

// Check if both Button.tsx and button.tsx exist
const capitalButtonPath = path.join(componentsDir, 'Button.tsx');
const lowercaseButtonPath = path.join(componentsDir, 'button.tsx');

const capitalExists = fs.existsSync(capitalButtonPath);
const lowercaseExists = fs.existsSync(lowercaseButtonPath);

if (capitalExists && lowercaseExists) {
  console.log(chalk.yellow('Found both Button.tsx and button.tsx files.'));
  
  // Read both files to check if they're identical
  const capitalContent = fs.readFileSync(capitalButtonPath, 'utf8');
  const lowercaseContent = fs.readFileSync(lowercaseButtonPath, 'utf8');
  
  if (capitalContent === lowercaseContent) {
    console.log(chalk.yellow('Files are identical. Removing lowercase version...'));
    
    // Backup the lowercase file just in case
    const backupPath = path.join(componentsDir, 'button.tsx.bak');
    fs.writeFileSync(backupPath, lowercaseContent);
    
    // Remove the lowercase file
    fs.unlinkSync(lowercaseButtonPath);
    
    console.log(chalk.green('Removed lowercase button.tsx file. A backup was created at button.tsx.bak'));
  } else {
    console.log(chalk.red('Files have different content. Manual review required.'));
    console.log(chalk.yellow('Please manually check both files and decide which one to keep.'));
  }
} else if (capitalExists) {
  console.log(chalk.green('Only Button.tsx (capital B) exists. No action needed.'));
} else if (lowercaseExists) {
  console.log(chalk.yellow('Only button.tsx (lowercase b) exists. Renaming to Button.tsx...'));
  
  // Read the lowercase file
  const content = fs.readFileSync(lowercaseButtonPath, 'utf8');
  
  // Write to the capital file
  fs.writeFileSync(capitalButtonPath, content);
  
  // Backup the lowercase file
  const backupPath = path.join(componentsDir, 'button.tsx.bak');
  fs.writeFileSync(backupPath, content);
  
  // Remove the lowercase file
  fs.unlinkSync(lowercaseButtonPath);
  
  console.log(chalk.green('Renamed button.tsx to Button.tsx. A backup was created at button.tsx.bak'));
} else {
  console.log(chalk.red('Neither Button.tsx nor button.tsx found. Please check the path.'));
}

console.log(chalk.blue('Button component fix completed.'));