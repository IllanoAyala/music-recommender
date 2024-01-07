const express = require('express');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'pug'); // Set the view engine to pug

require('dotenv').config();

app.get('/', (req, res) => {
    res.render('index', { // Render the index.pug file
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
