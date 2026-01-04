const express = require('express')
const app = express();
const port = 3000;

app.use(express.static('public'));

/* landing page GET request */
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html', (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error loading the page');
        }
    });
});

app.listen(port, () => {
    console.log(`My first app listening on port ${port}!`)
});