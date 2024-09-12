import { spawn } from 'node:child_process';

console.log('Starting the application...');

const app = spawn('node', ['build/start-server.js'], {
  stdio: 'inherit',
});

// Listen for errors when spawning the process
app.on('exit', (err) => {
  console.error('Failed to start the app:', err);
  process.exit(1); // Exit with a failure code if there is an error
});

// Listen for when the process starts
app.on('spawn', () => {
  console.log('App started successfully');
  setTimeout(() => {
    app.kill();
    process.exit(0);
  }, 3000);
});
