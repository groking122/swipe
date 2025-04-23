import CryptoJS from 'crypto-js';

/**
 * Generate a simple hash from an image file
 * 
 * This is a basic implementation of image hashing using MD5.
 * For production, consider using a perceptual hashing algorithm.
 */
export async function generateImageHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target || !event.target.result) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        // Get base64 data
        const base64 = event.target.result.toString();
        
        // Generate MD5 hash
        const hash = CryptoJS.MD5(base64).toString();
        resolve(hash);
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Check if a hash matches any existing hashes above a similarity threshold
 * This is a simple exact matching implementation.
 * 
 * For a more advanced implementation, you could use:
 * - Hamming distance for binary hashes
 * - Levenshtein distance for string comparison
 * - Perceptual hashing libraries for more sophisticated matching
 */
export function isHashSimilar(
  newHash: string,
  existingHashes: string[],
  exactMatch = true
): boolean {
  if (exactMatch) {
    return existingHashes.includes(newHash);
  } else {
    // For future implementation of fuzzy matching
    // This would compare character-by-character similarity
    return existingHashes.some(hash => newHash === hash);
  }
} 