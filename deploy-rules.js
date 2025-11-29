const { exec } = require('child_process');

console.log('Deploying Firebase Storage rules...');

exec('firebase deploy --only storage', (error, stdout, stderr) => {
  if (error) {
    console.error('Error deploying storage rules:', error);
    return;
  }
  if (stderr) {
    console.error('Stderr:', stderr);
    return;
  }
  console.log('Storage rules deployed successfully:', stdout);
});
