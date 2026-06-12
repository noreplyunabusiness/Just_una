const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({
        server_name: "rec-una API",
        status: "Online",
        message: "Welcome to the revival backbone!"
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
