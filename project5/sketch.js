
// document.addEventListener("DOMContentLoaded", ()=>{

let mySketch = new p5((s)=>{
    let xpos
    const socket = io();
    let circles = []
    var seconds = 0
    var target = s.random(60,60*3);
    var show_button = false

    s.setup = () => {
        s.createCanvas(s.windowWidth,700)
        xpos = 50
        s.frameRate(30)
    }

    s.draw = () => {
        s.background(228, 228, 228)
        

        if(s.frameCount % 30 == 0){
            seconds++
        }

        if(seconds >= target && !show_button){
            seconds = 0
            target = 10;
            show_button = true;
            button = s.createButton('I saw it!');
            button.position((s.windowWidth / 2) - 60, 550);
            button.mousePressed(() => {
                socket.emit('update-repeatable', { type: 'spoton' });
                console.log("button is pressed");
                button.attribute('disabled', 'true');  // disable the button
                window.location.reload();  // refresh
            });
            s.text("Ending in " + 10-seconds + " seconds", (s.windowWidth/2)-100, 590)
        }

        if(seconds >= target && show_button){
            show_button = false;
            target = s.random(60*1, 60*3);
            seconds = 0;
            if (button) {
                button.remove();
                button = null;
            }
            
        }

        if(!show_button){
            
            var serverValue = s.map(seconds, 0, target, 0, 3); // Fallback to 0 if undefined

            s.stroke('black');
            s.strokeWeight(10)
            s.line((s.windowWidth/2)-30, 255, (s.windowWidth/2)-90, 150)
            s.line((s.windowWidth/2)+30, 255, (s.windowWidth/2)+90, 150)

            s.line((((s.windowWidth/2)-30)+((s.windowWidth/2)-90))/2, (255+150)/2,(s.windowWidth/2)-100,350)
            s.line((((s.windowWidth/2)+30)+((s.windowWidth/2)+90))/2, (255+150)/2,(s.windowWidth/2)+100,350)
            s.noFill()
            s.ellipse((s.windowWidth/2),250,180,20) 
            s.ellipse((s.windowWidth/2),280,200,20) 
            
            s.fill(0)
            s.triangle(s.windowWidth/2, 255, (s.windowWidth/2)-60, 150, (s.windowWidth/2)+60, 150)

            s.noStroke()
            s.fill(10,10,10)
            s.rect((s.windowWidth / 2)-13,230,26,20 + serverValue*20)
            s.fill("black")
            s.circle(s.windowWidth / 2, 250 + serverValue*20, 30 + serverValue * 5); // Scale circle size with server data
            
            
            s.noStroke()
            s.fill("white")
            s.circle((s.windowWidth / 2) + 3*serverValue, 240 + serverValue*20, 5+ serverValue * 2); 
        } else {
            let serverValue = 4; 

            s.stroke('black');
            s.strokeWeight(10)
            s.line((s.windowWidth/2)-30, 255, (s.windowWidth/2)-90, 150)
            s.line((s.windowWidth/2)+30, 255, (s.windowWidth/2)+90, 150)

            s.line((((s.windowWidth/2)-30)+((s.windowWidth/2)-90))/2, (255+150)/2,(s.windowWidth/2)-100,350)
            s.line((((s.windowWidth/2)+30)+((s.windowWidth/2)+90))/2, (255+150)/2,(s.windowWidth/2)+100,350)
            s.noFill()
            s.ellipse((s.windowWidth/2),250,180,20) 
            s.ellipse((s.windowWidth/2),280,200,20) 
            
            s.fill(0)
            s.triangle(s.windowWidth/2, 255, (s.windowWidth/2)-60, 150, (s.windowWidth/2)+60, 150)

            s.stroke('yellow')
            s.strokeWeight(4)
            s.fill(10,10,10)
            s.fill("black")
            s.triangle((s.windowWidth / 2)-20, 250+serverValue*20, (s.windowWidth / 2)+20, 250+serverValue*20, s.windowWidth / 2, 300)
            s.circle(s.windowWidth / 2, 250 + serverValue*20, 30 + serverValue * 5); // Scale circle size with server data
            
            
            s.noStroke()
            s.fill("white")
            s.circle((s.windowWidth / 2) + 3*serverValue, 240 + serverValue*20, 5+ serverValue * 2); 

            s.fill("black");
            if((s.frameCount % 60)>30){
                s.fill('white')
            }
            s.textSize(40);
            s.textAlign(s.CENTER);
            s.textStyle(s.BOLD);
            s.text("Touchdown ending in " + (target - seconds) + " seconds!", s.windowWidth / 2, 590);
        }
    }



}, 'mysketch')
// })
