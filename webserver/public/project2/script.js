
// array to keep all the cities and offset from UTC
var cities = [
    { name: "New York", offset: -5*60, y: 85 },
    { name: "London", offset: 0*60, y: 70},
    { name: "Svalbard", offset: 1*60, y: 0},
    { name: "Shanghai", offset: 8*60, y: 80 },
    { name: "Melbourne", offset: 11*60, y:130 },
    { name: "Los Angeles", offset: -8*60,y: 115  },
    { name: "Dubai", offset: 4*60, y: 70 },
    { name: "Sao Paulo", offset: -3*60, y: 130},
    { name: "New Delhi", offset: 5.5*60, y: 120},
    { name: "McMurdo", offset: 13*60, y: 180},
    { name: "Lagos", offset: 1*60, y: 120}];
  

  /**
   * window.onload() function
   */
  window.onload = () => {

    // define the container
    const timelineContainer = document.getElementById("timeline-container");

    // create an array to hold all the occurances
    let cityElements = [];
  
    // for each city in the entry, add a dot by appending into the container
    cities.forEach(city => {
      const dot = createCityDot(city);
      timelineContainer.appendChild(dot);  // attach the dots to the timeline container
      cityElements.push({ city, element: dot }); // put in the array too
    });
  
    // update them using set interval
    setInterval(() => {
      cityElements.forEach(({ city, element }) => {
        var fraction;

        // check it if it's too close to the right edge, if it is, flip the label to the left
        if (dayFraction(city.offset) > 0.9) {
          element.classList.add("flip-label");
          fraction = dayFraction(city.offset) - 0.06
        } else {
          element.classList.remove("flip-label");
          fraction = dayFraction(city.offset)
        }

        // call on a later function, place the dot on the timeline
        placeMyCityDot(element, fraction);

        var localTime = getLocalTimeString(city.offset);
        // fetch the .city-label inside the element
        var labelElement = element.querySelector(".city-label");
        labelElement.textContent = `${city.name}\n${localTime}`;

      });
    }, 1000);  // for every 1000 milis
  };
  
  /**
   * createCityDot(city)
   * 
   * Make an element with a .city-dot container with a .city-circle and .city-label inside.
   * 
   * @param a dictionary of city name, offset and y value (height)
   * @returns a DOM element for that city
   */
  function createCityDot(city) {

    // create a container and give a class name of .city-dot
    const dotContainer = document.createElement("div");
    dotContainer.className = "city-dot";
    dotContainer.style.top = city.y + "px"; // give it a height

    // create the dot for the labels
    const circleDiv = document.createElement("div");
    circleDiv.className = "city-circle";
  
    // create the label
    const labelSpan = document.createElement("span");
    labelSpan.className = "city-label";
    labelSpan.textContent = city.name;  // placeholder
  
    // attach the dot and label onto the container
    dotContainer.appendChild(circleDiv);
    dotContainer.appendChild(labelSpan);
  
    return dotContainer;  // pass the container out of the func
  }
  
  /**
   * positionCityDot() function
   * 
   * @param dotElement, 
   * @param fraction
   */
  function placeMyCityDot(dotElement, fraction) {

    fraction = Math.max(0, Math.min(1, fraction));
    const percent = fraction * 100;
    // shift the container right respectively to the parent
    dotElement.style.left = percent + "%";
  }
  
  /**
   * dayFraction(offset)
   * 
   * @param takes an offset in minutes
   * @returns a fraction between 0 to 1 of how much of the day it has passed in the location 
   */
  function dayFraction(offsetByMinutes) {

    // get the time 
    const now = new Date();
  

    const utcMil = now.getTime() + now.getTimezoneOffset() * 60_000;
    const cityMillis = utcMil + offsetByMinutes * 60_000;
  
    // create a local date
    const cityDate = new Date(cityMillis);
  
    const hours = cityDate.getHours();
    const minutes = cityDate.getMinutes();
    const seconds = cityDate.getSeconds();
    const ms = cityDate.getMilliseconds();
  
    // total ms from local midnight
    const totalMs = hours * 3_600_000 + minutes * 60_000 + seconds * 1_000 + ms;
  
    return totalMs / 86_400_000; // this is the total milliseconds 
  }
  
  /**
   * getLocalTimeString(offset)
   * 
   * @param offset value in minutes
   * @returns a local time string "HH:MM:SS" for a given offset
   */
  function getLocalTimeString(offsetMinutes) {
    const now = new Date();
    const utcMillis = now.getTime() + now.getTimezoneOffset() * 60_000;
  
    // add offsets and create a separeate date obj for local time
    const cityMillis = utcMillis + offsetMinutes * 60_000;
    const cityDate = new Date(cityMillis);
  
    // get local hours, minutes, and seconds
    const hours = cityDate.getHours().toString().padStart(2, "0");
    const mins  = cityDate.getMinutes().toString().padStart(2, "0");
    const secs  = cityDate.getSeconds().toString().padStart(2, "0");
  
    return `${hours}:${mins}:${secs}`;
  }