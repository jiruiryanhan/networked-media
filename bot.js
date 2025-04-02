// import library
require("dotenv").config()
const m = require("masto")

const masto = m.createRestAPIClient({
    url: "https://networked-media.itp.io/", 
    accessToken: process.env.TOKEN
})


var base = ["| [] || [] |   |   | [] || [] |","| [] || [] |  .|.  | [] || [] |"," --------------------------"]

var storey = [" | [] || [] ||[ ]|| [] || [] |", " --------------------------"]

var roof = [" \/\/\/\/\/\/\/\/  🕙  \\\\\\\\\\\\"]

var skyscraper = ""

for(i = roof.length-1; i>= 0; i--){
    skyscraper += roof[i] +"\n"
}


for(j = 0; j<6; j++){
    for(i = storey.length-1; i>= 0; i--){
        skyscraper += storey[i] +"\n"
    }
}

for(i = base.length-1; i>= 0; i--){
    skyscraper += base[i] +"\n"
}

skyArray = skyscraper.split("")
skyArray = skyArray.reverse() 
limit = skyArray.length
count = 235



console.log(skyscraper)

async function makeStatus(text){

    const status = await masto.v1.statuses.create({
        
        // the thing that will be posted
        status: text,
        visibility: "public" // when testing, change to private

    })

    console.log(status.url)

}

printSkyscraper()

// makeStatus("Hi!")


setInterval(() => {
    count++
    if (count==limit){
        printSkyscraper()
        count = 0
    }
}, 86400000/limit);

setInterval(() => {
    if (limit - count > 5){
        printSkyscraper()
    }
}, 5400000)

function printSkyscraper(){
    let toPost = "🚧🧱👷‍♀️\n"

    var skysc = ""

    for(i = 0; i<count; i++){
        skysc = skyArray[i] + skysc
    }

    makeStatus(toPost + skysc + "\nSkyscraper " + Math.round((count/limit)*100) +"% done." )
}