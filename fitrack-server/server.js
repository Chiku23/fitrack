const express = require('express');
const app = express();
const PORT = 3000;

// Handle basic HTTP GET request at root URL
app.get('/', (req, res) => {
    res.send('Hello World! Your Node.js application is running successfully.');
});

// Start the local network server
app.listen(PORT, () => {
    console.log(`Server is operating locally at http://localhost:${PORT}`);
});
