// 1. lib imports
const express = require("express")
const bodyParser = require("body-parser")
const multer = require("multer")
const fs = require('fs')

// 2. app settings 
const app = express()
const encodedParser = bodyParser.urlencoded({extended: true})
const up = multer({dest: "public/upload"})


app.use(express.static('public')) // setting static file locations to be public: CSS, front end js, assets, images
app.use(encodedParser) //allows express to parse the body of the request
app.set("view engine", "ejs") // allow us to use render() function, use ejs as templating engines. 

let posts = []
let allPosts = [];
let myPostArray = [];

// read the data stored in the json
fs.readFile('posts.json', (err, data) => {
    if (!err) {
        myPostArray = JSON.parse(data);
    }
});

// saves the data in a json, we they are not cleared
function savePosts() {
    fs.writeFile('posts.json', JSON.stringify(myPostArray, null, 2), err => {
        if (err) console.error("Error saving posts:", err);
    });
}

// 3. ROUTES

app.get("/", (req, res) => {
    res.render("index.ejs", { allPosts: myPostArray || [] });
});

app.get("/atis", async (req, res) => {
    try {
        let response = await fetch("https://datis.clowd.io/api/KJFK");

        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        let data = await response.json();


        if (!data || data.length === 0) {
            throw new Error("Empty response from API");
        }

        let parsedData = parseATIS(data[0]);
        res.json(parsedData);
    } catch (error) {
        console.error("Error fetching ATIS data:", error);
        res.status(500).json({ error: "Failed to fetch ATIS data" });
    }
});

app.get("/weather", async (req, res) => {
    try {
        let response = await fetch("https://api.openweathermap.org/data/3.0/onecall?lat=40.64&lon=-73.78&exclude=daily,minutely,alerts&appid=1988dfc3f6024723d331e9f26414b172");
        let data = await response.json();

        let next6Hours = data.hourly.slice(0, 6).map(hour => ({
            time: new Date(hour.dt * 1000).toLocaleTimeString(),
            windSpeed: hour.wind_speed,
            windDirection: hour.wind_deg
        }));

        res.json(next6Hours); //send json

    } catch (error) {
        console.error("Error fetching weather data:", error);
        res.status(500).json({ error: "Failed to fetch weather data" });
    }
});

// upload route, when clicked button "add"
app.post('/upload', (req, res) => {
    let now = new Date();
    let currentHHMM = parseInt(now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0'));
    let parsedArrivalTime = parseInt(req.body.arrTime);

    let post = {
        flightNo: req.body.textMessage || "Unknown Flight",
        aircraftType: req.body.airType || "Unknown Type",
        reason: req.body.reason || "No reason provided",
        arrivalTime: !isNaN(parsedArrivalTime) ? parsedArrivalTime : null, 
        departureAirport: req.body.depApt || "Unknown Airport",
        registration: req.body.reg || "Unknown Registration",
        date: now.toLocaleString(),
        upvotes: 0 
    };

    if (post.arrivalTime !== null) {
        myPostArray.unshift(post);
    }

    let beforeFilterLength = myPostArray.length;
    myPostArray = myPostArray.filter(flight => flight.arrivalTime !== null && flight.arrivalTime >= currentHHMM);
    let afterFilterLength = myPostArray.length;
    myPostArray.sort((a, b) => a.arrivalTime - b.arrivalTime);

    savePosts(); 
    res.redirect('/');
});

app.post('/upvote', (req, res) => {
    let flightNo = req.body.flightNo;

    let post = myPostArray.find(p => p.flightNo === flightNo);

    post.upvotes = (post.upvotes || 0) + 1; // increment 
    savePosts(); // save the data

    res.redirect('/'); 
});

app.get('/allpostsinjson', (req, res) => {
    res.json(myPostArray);
});



app.listen(3339, ()=>{
    console.log("server is live at http://127.0.0.1:3339")
})


// helper functions to parse atis

function parseATIS(data) {
    let atisText = data.datis;

    return {
        infoCode: extractInfoCode(atisText),
        wind: extractWind(atisText),
        arrivalRunway: extractArrivalRunway(atisText),
        departureRunway: extractDepartureRunway(atisText),
        visibility: extractVisibility(atisText)
    };
}

function extractInfoCode(text) {
    let match = text.match(/INFO ([A-Z])/);
    return match ? match[1] : "N/A";
}

function extractWind(text) {
    let match = text.match(/(\d{3})(\d{2})G?(\d{2})?KT/);
    if (match) {
        return {
            direction: parseInt(match[1], 10),
            speed: parseInt(match[2], 10),
            gusts: match[3] ? parseInt(match[3], 10) : null
        };
    }
    return { direction: "N/A", speed: "N/A", gusts: "N/A" };
}

function extractArrivalRunway(text) {
    let match = text.match(/APPROACH IN USE .*? RY (\d{2}[LCR]?)/);
    return match ? match[1] : "N/A";
}

function extractDepartureRunway(text) {
    let match = text.match(/DEPG RY (\d{2}[LCR]?)/);
    return match ? match[1] : "N/A";
}

function extractVisibility(text) {
    let match = text.match(/(\d{1,2})SM/);
    return match ? `${match[1]} statute miles` : "N/A";
}

