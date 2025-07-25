console.log('🔍 Starting test validate...');

try {
  console.log('Testing logger import...');
  const { createLogger } = await import('./scripts/logger.js');
  console.log('✅ Logger imported');
  
  const log = createLogger('test');
  console.log('✅ Logger created');
  
  console.log('Testing fs imports...');
  const { readdir, readFile, stat } = await import('fs/promises');
  console.log('✅ FS imports work');
  
  console.log('Testing path import...');
  const { join } = await import('path');
  console.log('✅ Path import works');
  
  console.log('🎉 All imports successful!');
} catch (error) {
  console.error('❌ Error:', error);
}
