window.onload = () => {
    console.log('script.js has loaded');
    let atisData = null; 

    let footer = document.createElement('footer');
    document.body.append(footer);

   

    async function fetchATIS() {
        console.log("feting airport atis..."); 

        try {
            let response = await fetch("/atis");
            let data = await response.json();
            let display = document.getElementById("atis-display");
            let runwayChart = document.getElementById("runway-chart");



            while (display.firstChild) {
                display.removeChild(display.firstChild);
            }

            function createRow(label, value, className = "") {
                let row = document.createElement("div");
                row.classList.add("atis-row");

                let labelDiv = document.createElement("div");
                labelDiv.classList.add("atis-label");
                labelDiv.textContent = label;

                let valueDiv = document.createElement("div");
                valueDiv.classList.add("atis-value");

                if (className) {
                    className.split(" ").forEach(cls => valueDiv.classList.add(cls));
                }
                valueDiv.textContent = value ?? "N/A";

                row.appendChild(labelDiv);
                row.appendChild(valueDiv);
                return row;
            }

            let visibilityText = data.visibility ?? "N/A";
            let visibilityClass = "green";

            if (typeof visibilityText === "string" && visibilityText.includes("statute miles")) {
                let visibilityValue = parseInt(visibilityText);
                if (visibilityValue < 3) {    // change color if too little
                    visibilityClass = "red";
                }
            }

            let windInfo = data.wind 
                ? `${data.wind.direction}° at ${data.wind.speed} knots ${data.wind.gusts ? `(Gusts: ${data.wind.gusts} knots)` : ""}`
                : "N/A";

            display.appendChild(createRow("ATIS Info Code:", data.infoCode ?? "N/A"));
            display.appendChild(createRow("Wind:", windInfo, "atis-wind"));

            display.appendChild(createRow("Arrival Runway:", data.arrivalRunway ?? "N/A", "atis-runway"));
            display.appendChild(createRow("Departure Runway:", data.departureRunway ?? "N/A", "atis-runway"));            display.appendChild(createRow("Visibility:", visibilityText, `atis-visibility ${visibilityClass}`));

            let lastUpdateDiv = document.createElement("div");
            lastUpdateDiv.classList.add("atis-last-update");
            lastUpdateDiv.textContent = `Last Updated: ${new Date().toLocaleTimeString()}`;
            display.appendChild(lastUpdateDiv);

            console.log("ATIS display updatd");

            let arrivalRunway = data.arrivalRunway || "N/A";

            let runwayImageMap = {
                "22L": "22.png",
                "22R": "22.png",
                "31L": "31.png",
                "31R": "31.png",
                "13L": "13.png",
                "13R": "13.png",
                "4L": "4.png",
                "4R": "4.png"
            };

            let newImage = runwayImageMap[arrivalRunway] || "JFK.png";
            runwayChart.src = newImage;

            atisData = data;  
            checkRunwayChange();
            checkSpottingCondition();

        } catch (error) {
            console.error("error fetching ATIS data:", error);
            let display = document.getElementById("atis-display");
            display.textContent = "Failed to load ATIS data.";
        }
    }

    fetchATIS();
    setInterval(fetchATIS, 10000);

    let windForecast = [];

    // fetch weather data
    async function fetchWeather() {
        console.log("fetchWeather() is running...");
    
        try {
            let response = await fetch("/weather");    
            let data = await response.json();
            console.log("Received Weather Data:", data);
    
            let display = document.getElementById("weather-display");
    
            if (!display) {
                console.error("Weather display element not found!");
                return;
            }
    
            while (display.firstChild) {
                display.removeChild(display.firstChild);
            }
    
            // append a title
            let title = document.createElement("h3");
            title.textContent = "Wind Forecast at KJFK";
            display.appendChild(title);
            

            windForecast = []; // reset wind data

            // loop to display the wind info of the next 6 hours
            data.forEach((hour, index) => {
                windForecast.push({
                    hour: index + 1,
                    windSpeed: hour.windSpeed,
                    windDirection: hour.windDirection,
                });

                let row = document.createElement("div");
                row.classList.add("weather-row");
    
                let timeDiv = document.createElement("div");
                timeDiv.classList.add("weather-time");
                timeDiv.textContent = `In ${index + 1} hour${index === 0 ? "" : "s"}`; 
                let windDiv = document.createElement("div");
                windDiv.classList.add("weather-wind");
                windDiv.textContent = `${hour.windDirection}° at ${hour.windSpeed} knots `;
    
                row.appendChild(timeDiv);
                row.appendChild(windDiv);
                display.appendChild(row);
            });
    
            checkRunwayChange();
            checkSpottingCondition();
    
        } catch (error) {
            console.error("Error fetching weather data:", error);
            let display = document.getElementById("weather-display");
            display.textContent = "Failed to load weather data.";
        }
    }
    
    fetchWeather();
    setInterval(fetchWeather, 600000);

    function checkRunwayChange() {
        console.log("🔍 Checking Runway Change...");
        if (!atisData || windForecast.length < 1) {
          console.warn("Not enough data. Skipping.");
          return;
        }
      
        let runwayDisplay = document.getElementById("prediction-display");
        if (!runwayDisplay) return console.error("prediction display element not found!");
      
        let currentWindDirection = atisData.wind.direction;
        let runwaysInUse = [atisData.arrivalRunway, atisData.departureRunway]
          .filter(Boolean)
          .map(r => parseInt(r.match(/\d+/)[0]) * 10);
      
        let windDirections = windForecast.map(w => w.windDirection);
        let minWind = Math.min(...windDirections);
        let maxWind = Math.max(...windDirections);
        let firstHourWind = windForecast[0].windDirection;
      
        // set the default to UNLIKELY
        let colorWord = `<span style="color:lightgreen;">UNLIKELY</span>`;
      
        // check if wind direction changes 
        if (Math.abs(maxWind - minWind) > 40) {
          colorWord = `<span style="color:yellow;">LIKELY</span>`;
        }
      
        // check if immediate change is needed, if big difference in next hour
        let immediateThreshold = 70; 
        let immediateChange = runwaysInUse.some(runway => Math.abs(firstHourWind - runway) > immediateThreshold);
        if (immediateChange) {
          colorWord = `<span style="color:red;">SOON</span>`;
        }
      
        let finalText = `Runway change is ${colorWord}`;

        runwayDisplay.innerHTML = finalText;
        console.log("runway change prediction:", finalText);
      }

      function checkSpottingCondition() {
        console.log("checking spotting condition...");
    
        if (!atisData) {
            console.warn("No ATIS data yet. Skipping spotting condition check.");
            return;
        }
    
        let visibilityText = atisData.visibility || "0 statute miles";
        let numericVis = parseFloat(visibilityText);
    
        if (isNaN(numericVis)) {
            console.warn("Invalid visibility format:", visibilityText);
            numericVis = 0;
        }
    
        let now = new Date(); 
        let hour = now.getHours(); 
    
        let timePeriod = getTimePeriod(hour);
  
        let condition = "POOR";
        let color = "red";
    
        if (numericVis < 1) {
            condition = "POOR";
            color = "red";
        } else if (timePeriod === "night") {
            condition = "POOR";
            color = "red";
        } else if (timePeriod === "twilight") {
            condition = "FAIR";
            color = "yellow";
        } else {
            if (numericVis > 4) {
                condition = "EXCELLENT";
                color = "green";
            } else if (numericVis >= 2) {
                condition = "GOOD";
                color = "green";
            } else if (numericVis >= 1) {
                condition = "FAIR";
                color = "yellow";
            } else {
                condition = "POOR";
                color = "red";
            }
        }
    
        let spottingText = document.getElementById("spotting-text");
        if (!spottingText) {
            console.error("no id=spotting-text found in HTML");
            return;
        }
    
        spottingText.innerHTML = `
            Spotting condition is 
            <span style="color:${color}; font-weight:bold;">${condition}</span>
        `;
    
    }
    


    function getTimePeriod(hour) {
        if ((hour >= 7 && hour < 8) || (hour >= 18 && hour < 19)) {
            return "twilight";
        } else if (hour >= 8 && hour < 18) {
            return "day";
        } else {
            return "night";
        }
    }
};