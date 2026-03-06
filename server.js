const port = 6767;
const express = require('express');
const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});

app.get(/\/.*$/, (req, res) => {
    console.log(req.url);
    res.sendFile(__dirname + req.url);
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});