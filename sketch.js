//initialize all global variables
let handPose;
let state = "CLOSED";
let soundtrack;
let screamSound;
let distortion;

let screenFlash = 0;
let video;
let glitchTimer = 0;

let endStage = 0;
let endTimer = 60;

let hands = [];
let confidenceThreshold = 0.96;

let girlImages = [];
let bg_img;
let emoji;


let speed_buffer = 120; // 2 seconds at the start
let seq_states = ["CLOSED", "R_OPEN", "CLOSED", "L_OPEN", "CLOSED", "OPEN"];
let game_state = "TUTORIAL";



let tutorial_step = 0;
let tutorial_texts = [
  "Hello! Let's play a game 'Ladushki'! Now press space.",
  "Match my hand gestures before the timer runs out.",
  "If you make mistakes, I will get... upset. So be precise!",
  "Let's practice! Show me a both hands open.",
  "Great! Now show me hand clap pose.",
  "Okay, now right palm open!",
  "Awesomw! Now show me left palm open!",
  "Perfect! If you're ready to start, press ENTER!"
];

//text display
let myFont;
let text_counter = 0;
let text_speed = 2;



class Girl {
  constructor() {
    this.x = width/2;
    this.y = height/2;
    this.state = "";
    this.level = 0; //anger level initializer
    this.current_state = 0;
    this.anger_buffer = 10; //change depending on the anger level
    
    this.poseTimer = speed_buffer; //buffer for player's reaction
    this.isSpeaking = false;
    this.speakTimer = 0;
    this.currentDialogue = "";
    
    //for speaking
    this.currentSector = -1; 
    this.phraseIndex = 0;    
    
    //for final jumpscare
    this.jumpscareTimer = 60;
    this.isJumping = false;
    
    
    //set phrases girl will say depending on the anger level (4 sectors)
    this.phraseData = [
      { min: 1, max: 20, phrases: ["That is fine. Let's try again!", "Oops! Ha-ha, let's try once more!", "Next time! Should we keep going?"] },
      { min: 21, max: 50, phrases: ["Ah...Let's do one more.", "Wha...Okay, one more try.", "Ehh, that's fine. One more, c'mon."] },
      { min: 51, max: 80, phrases: ["Again?.. Should I really give you one more chance?", "Hey, that's so annoying. Lock in.", "Are you being for real?.."] },
      { min: 81, max: 100, phrases: ["It's not funny anymore. Stop it.", "Why are you doing this?! Can't you focus?!!", "Hey...This...you're really trying to make mad?!"] }
    ];
    
    //set reaction time buffers based on anger level (4 sectors)
    this.reactionData = [
      { min: 1, max: 20, time: 130 },
      { min: 21, max: 50, time: 90 },
      { min: 51, max: 80, time: 70 },
      { min: 81, max: 100, time: random(60, 120) } //for the last part make inconsistent tempo that will fit "distorted" environment
    ];
  }
  
  update() {    
    //for sounds
    let current_rate = map(this.level, 50, 100, 1.0, 1.3, true);
    soundtrack.rate(current_rate);
    if (this.level >= 70) {
      let intensity = map(this.level, 70, 100, 0, 0.3); 
      distortion.set(intensity); // set the distortion amount
      distortion.drywet(map(this.level, 70, 100, 0, 0.2));
    } else {
    distortion.drywet(0); // keep it clean under level 70
    }
    
    if (this.level >= 80 && !this.isSpeaking) {
      if (random(100) < 0.2) { 
        if (soundtrack.isPlaying()) soundtrack.pause();
        else soundtrack.play();
      }
    }
    
    if (this.isSpeaking) {
      this.speakTimer--;
      if (this.speakTimer <= 0) {
        this.isSpeaking = false;
        this.change_state();
        
        let speed_buffer = this.reactionData[this.currentSector].time;
        
        this.poseTimer = speed_buffer;
        
        if (!soundtrack.isPlaying()) {
          soundtrack.play();
        }
      }
    } else {
      if (this.state === state) this.compare();
      else {
        this.poseTimer--;
        if (this.poseTimer <= 0) {
          this.compare(); //check the pose after the time buffer
        }
      }
    }
  }   
 
  //change the pose of the girl
  change_state() { 
    this.state = seq_states[this.current_state];
    this.current_state += 1;
    if (this.current_state >= seq_states.length) {
      this.current_state = 0;
    }
    if (this.current_state == 'CLOSED') closed_clap.play();
    else clap.play();
  }
  
  //method for drawing
  draw_girl() {
    
    let imgIndex = 0;
    if (this.level >= 1 && this.level <= 20) imgIndex = 0;
    else if (this.level > 20 && this.level <= 50) imgIndex = 1;
    else if (this.level > 50 && this.level <= 80) imgIndex = 2;
    else if (this.level > 80) imgIndex = 3;
    
    let spriteIndex = 0;
    if (this.state == "CLOSED") spriteIndex = 0;
    else if (this.state == "R_OPEN") spriteIndex = 3;
    else if (this.state == "L_OPEN") spriteIndex = 2;
    else if (this.state == "OPEN") spriteIndex = 1;
    
    
    if (this.level < 100) {
      this.currentImg = girlImages[imgIndex];
    }
    let frameWidth = this.currentImg.width / 4; // Total width divided by 4 frames
    let frameHeight = this.currentImg.height;
    
    let sourceX = spriteIndex * frameWidth;
    let sourceY = 0;
    let scaleFactor = 0.55; // Adjust this number to make her bigger/smaller
    
    if (endStage === 1) {
      scaleFactor = 0.6; // step closer during pre-jumpscare scene
    } else if (endStage > 1) {
      scaleFactor = 0.65;
    }
    
    
    let destW = frameWidth * scaleFactor;
    let destH = frameHeight * scaleFactor;
    
    push();
    imageMode(CENTER);
    
    image(this.currentImg, width/2, height/2 + 30, destW, destH, sourceX, sourceY, frameWidth, frameHeight);
    pop();
    
    //overlay with webcam for a creepy effect
    if (this.level > 90) {
      push();
      
      let ghostAlpha = map(this.level, 90, 100, 0, 20);
      tint(255, ghostAlpha);

      translate(width, 0);
      scale(-1, 1);

      tint(255, ghostAlpha);
      imageMode(CORNER);
      image(video, 0, 0, width, height);

      noTint();
      pop();
    }
    
    
  
    
    if (this.level < 100) { 
      draw_angerLevel(this.level);
      if (this.isSpeaking) {
        draw_text(this.currentDialogue, this.level);
      } else if (!this.isSpeaking && game_state === "START") {
        draw_text("Time left to react: " + this.poseTimer, this.level);
      }
    }
  }
  
  //set method to compare the states
  compare() {
    //ADD TIME BUFFER for user to react
    if (this.state != state) {
      this.level += this.anger_buffer; //CHANGE DEPENDING ON THE STATE
      this.currentDialogue = this.dialogue();
      text_counter = 0;
      this.isSpeaking = true;
      this.speakTimer = 120;
      
      screenFlash = map(this.level, 60, 100, 150, 250);
      
      if (this.level >= 60) {
        soundtrack.pause();
      }
    } else {
        this.change_state();
        // dynamic speed based on anger level, speeding up
        let dynamic_speed = speed_buffer; // deefault 120 = 2 seconds

        for (let i = 0; i < this.reactionData.length; i++) {
          if (this.level >= this.reactionData[i].min && this.level <= this.reactionData[i].max) {
            if (i === 3) {
              dynamic_speed = random(60, 120);
            } else {
              dynamic_speed = this.reactionData[i].time;
            }
            break;
          }
        }
        this.poseTimer = dynamic_speed;
      }
  }
  
  //set method for talking that will be called when the player makes mistake
  dialogue() {
    let activeSectorIndex = -1;
    // check the sector
    for (let i = 0; i < this.phraseData.length; i++) {
      if (this.level >= this.phraseData[i].min && this.level <= this.phraseData[i].max) {
        activeSectorIndex = i;
        break; 
      }
    }
    // error check
    if (activeSectorIndex === -1) {
      return "level error"; 
    }
    // reset the counter if the sector changed
    if (activeSectorIndex !== this.currentSector) {
      this.currentSector = activeSectorIndex;
      this.phraseIndex = 0;
    }
    // get the array of phrases
    let availablePhrases = this.phraseData[this.currentSector].phrases;

    // select the phrase by counter
    let selectedPhrase = availablePhrases[this.phraseIndex];
    this.phraseIndex++;

    // error preventing
    // loop back to 0 if reached the end
    if (this.phraseIndex >= availablePhrases.length) {
      this.phraseIndex = 0; 
    }
    return selectedPhrase;
  }
  
  //JUMPSCARE TRIGGER
  triggerJumpscare() {
    if (!this.isJumping) {
      this.isJumping = true;
      soundtrack.stop();
      
      screamSound.rate(1.5);
      screamSound.setVolume(5.0);
      screamSound.play(); 
      
      // capture the exact frame of the user's face
      this.userSnapshot = video.get(); 
    }

    this.jumpscareTimer--;

    if (this.jumpscareTimer > 0) {
      background(0); // clear the screen
      
      push();
      // lock it to the center
      translate(width / 2, height / 2);
    
      scale(4);
      
      imageMode(CENTER);
      push();
      scale(-1, 1);
      
      // harsh red tint
      tint(255, 0, 0); 
      
      if (this.userSnapshot) {
        image(this.userSnapshot, 0, 0, width, height);
      }
      pop();
      
      if (frameCount % 2 === 0) {
        filter(INVERT); // flashing negative effect
      } else if (frameCount % 4 === 0) {
        filter(ERODE);
      }
      filter(POSTERIZE, 5); // extreme low-bit pixelation
      pop();

    } else {
      // final screen
      screamSound.pause();
      background(0);
      fill(255, 0, 0);
      game_state = "GAME_OVER"; 
    }
  }
}

function preload() {
  // load the handPose model
  handPose = ml5.handPose();
  //audios
  soundFormats('mp3', 'ogg');
  closed_clap = loadSound('audios/closed_clap.mp3');
  clap = loadSound('audios/clap.mp3');
  soundtrack = loadSound('audios/soundtrack.mp3');
  screamSound = loadSound('audios/scream.mp3');
  //font
  myFont = loadFont('pixelFont.ttf');
  //additional images
  bg_img = loadImage('background.png');
  emoji = loadImage('emoji.png');
  //sprites
  girlImages[0] = loadImage('sprites/level1.png');
  girlImages[1] = loadImage('sprites/level2.png');
  girlImages[2] = loadImage('sprites/level3.png');
  girlImages[3] = loadImage('sprites/level4.png');
}

//draw text like a typewriter
function draw_text(t, anger_level) {
  //add shaking for higher anger levels
  let shakeAmount = 0;
  if (anger_level > 40 && anger_level < 100) {
    shakeAmount = map(anger_level, 40, 99, 0, 5, true); 
  }
  // random offset
  let offsetX = random(-shakeAmount, shakeAmount);
  let offsetY = random(-shakeAmount, shakeAmount);

  let currentIndex = floor(text_counter / text_speed);
  if (currentIndex < t.length) {
    text_counter++;
  }
  let displayedText = t.substring(0, currentIndex);

  push();
  translate(offsetX, offsetY);
  
  textFont(myFont);
  textSize(19);
  noStroke();
  
  fill(0);
  textAlign(CENTER, CENTER);
  rect(width/2, height*0.9, width*0.6+15, 40); //lines from side
  rect(width/2, height*0.9, width*0.6, 55); //lines from up/down
  //dialogue window
  fill(237, 240, 240);
  rect(width/2, height*0.9, width*0.6, 40);
  fill(0);
  text(displayedText, width/2, height*0.9);
  pop();
  
}

//method for drawing anger level
function draw_angerLevel(anger_level) {
  let x = 30;           // horizontal position
  let baseY = 180;      // bottom of the bar
  let w = 25;           // width of the bar
  let maxH = 120;       // maximum height of the bar
  
  // calculate the height of the anger fill
  let currentH = map(anger_level, 0, 100, 0, maxH);
  
  let shakeAmount = 0;
  if (anger_level > 40 && anger_level < 100) {
    shakeAmount = map(anger_level, 40, 99, 0, 5, true); 
  }
  // random offset
  let offsetX = random(-shakeAmount, shakeAmount);
  let offsetY = random(-shakeAmount, shakeAmount);

  translate(offsetX, offsetY);
  
  push();
  imageMode(CENTER);
  image(emoji, x, 30, 60, 45);
  pop();

  push();
  rectMode(CENTER);
  noStroke();

  //pixel border
  fill(0);
  rect(x, baseY - maxH/2, w + 10, maxH + 5); 
  rect(x, baseY - maxH/2, w + 5, maxH + 15);

  fill(217, 214, 212);
  rect(x, baseY - maxH/2, w, maxH);

  // make the bar grow from the bottom up
  rectMode(CORNER);
  fill(212, 53, 75); // Red anger to match emoji
  
  rect(x - w/2, baseY, w, -currentH);
  
  pop();
}

//detect the state of hands
function detect() {
  state = "";
  
  if (hands.length === 0) {
    state = "CLOSED";
    return;
  }

  let leftOpen = false;
  let rightOpen = false;

  for (let hand of hands) {
    // get confidence score
    let currentConfidence = hand.confidence || hand.handInViewConfidence || 0;

    // skip if the level of confidence lower than set
    if (currentConfidence < confidenceThreshold) {
      continue; 
    }
    
    //DISTANCE BETWEEN THUMB AND PINKY is also counted for state of the hand
    //define what means when hand is open and set status of the user's hand positions
    if (hand.keypoints && hand.keypoints.length >= 21) {
      let isHandOpen = (
        hand.keypoints[4].y < hand.keypoints[2].y &&   
        hand.keypoints[8].y < hand.keypoints[5].y &&   
        hand.keypoints[12].y < hand.keypoints[9].y &&  
        hand.keypoints[16].y < hand.keypoints[13].y && 
        hand.keypoints[20].y < hand.keypoints[17].y &&
        abs(hand.keypoints[4].x - hand.keypoints[20].x) > abs(hand.keypoints[5].x - hand.keypoints[17].x));

      if (isHandOpen) {
        if (hand.handedness === "Right" && hand.keypoints[20].x - hand.keypoints[4].x > 0) {
          leftOpen = true;  
        } else if (hand.handedness === "Left" && hand.keypoints[20].x - hand.keypoints[4].x < 0) {
          rightOpen = true; 
        }
      }
    }
  }

  // update global state;
  if (leftOpen && rightOpen) {
    state = "OPEN";       
  } else if (leftOpen) {
    state = "L_OPEN";     
  } else if (rightOpen) {
    state = "R_OPEN";     
  } else {
    state = "CLOSED";     
  }
}

function draw_glitch(vidSource, x, y, w, h) {
  let zoom = map(girl.level, 50, 100, 1.0, 3.0);
  zoom = constrain(zoom, 1.0, 3.0); 
  
  let cropW = vidSource.width / zoom;
  let cropH = vidSource.height / zoom;
  let startX = (vidSource.width - cropW) / 2;
  let startY = (vidSource.height - cropH) / 2;
  
  // draw cropped img
  // image(img, dx, dy, dWidth, dHeight, sx, sy, sWidth, sHeight)
  image(vidSource, x, y, w, h, startX, startY, cropW, cropH);
}

function runTutorial() {
  background(200);

  push();
  imageMode(CORNER);
  image(bg_img, 0, 0, width, height);
  pop();

  push();
  translate(width, 0);
  scale(-1, 1);
  rectMode(CORNER);
  fill(0);
  rect(10, 20, width/3 + 20, height/3);
  rect(20, 10, width/3, height/3 + 20);
  pop();
  
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 20, 20, width / 3, height / 3);
  pop();

  // Constantly detect the hand states
  detect();
  
  if (tutorial_step === 3) {
    girl.state = "OPEN";
  } else if (tutorial_step === 4) {
    girl.state = "CLOSED";
  } else if (tutorial_step === 5) {
    girl.state = "R_OPEN";
  } else if (tutorial_step === 6) {
    girl.state = "L_OPEN";
  } else {
    girl.state = "CLOSED"; // Default state for greeting and ending texts
  }
  
  girl.current_state = "OPEN";
  // auto-progress trial steps if they do the correct pose
  if (tutorial_step === 3 && state === "OPEN" && text_counter > 50) {
    tutorial_step++;
    text_counter = 0;
  } else if (tutorial_step === 4 && state === "CLOSED" && text_counter > 50) {
    tutorial_step++;
    text_counter = 0;
  } else if (tutorial_step === 5 && state === "R_OPEN" && text_counter > 50) {
    tutorial_step++;
    text_counter = 0;
  } else if (tutorial_step === 6 && state === "L_OPEN" && text_counter > 50) {
    tutorial_step++;
    text_counter = 0;
  }

  girl.draw_girl();
  
  // draw the dialogue text
  push();
  draw_text(tutorial_texts[tutorial_step], 0);
  pop();
}

//reset the whole game upon calling this function
function resetGame() {
  // reset global variables
  game_state = "START";
  state = "CLOSED";
  text_counter = 0;
  screenFlash = 0;
  girlImages = [];
  
  girl = new Girl();
  
  // reset girl's variables
  girl.current_state = 0; 
  girl.level = 0;
  girl.change_state();
  endStage = 0;
  endTimer = 60;

  
  // reset the audio
  soundtrack.stop();
  soundtrack.rate(1.0);
  soundtrack.setVolume(1.0);
  distortion.set(0);
  distortion.drywet(0);
  soundtrack.loop();
}


function draw_video() {
  push();
  imageMode(CORNER);
  image(bg_img, 0, 0, width, height);
  
  //layer that gets the room darker as the anger level rises
  rectMode(CORNER);
  let mask_level = map(girl.level, 20, 100, 0, 180);
  noStroke();
  fill(0, mask_level);
  rect(0, 0, 640, 480);
  pop();
  
  push(); // save the normal, un-flipped canvas state
  translate(width, 0);
  scale(-1, 1);
  
  // draw the webcam borders
  rectMode(CORNER);
  fill(0);
  rect(10, 20, width/3 + 20, height/3);
  rect(20, 10, width/3, height/3 + 20);
  
  //glitch section
  push();
  let x = 20;
  let y = 20;
  
  if (girl.level >= 50 && girl.level < 100) {
    x += random(-5, 5);
    y += random(-5, 5);

    draw_glitch(video, x, y, width/3, height/3);
  } else {
    // draw normal video otherwise
    image(video, x, y, width/3, height/3);
  }
  pop();
}

function setup() {
  rectMode(CENTER);
  textAlign(CENTER);
  textFont(myFont);
  
  distortion = new p5.Distortion(0);
  soundtrack.disconnect();
  soundtrack.connect(distortion);
  soundtrack.loop();
  
  createCanvas(640, 480);
  // Create the webcam video and hide it
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  // start detecting hands from the webcam video
  handPose.detectStart(video, gotHands);
  girl = new Girl();
  girl.change_state();
}

function draw() {
  if (game_state === "TUTORIAL") {
    runTutorial();
    return; // exit out of draw() before all the steps below
  } 
  
  push();
  background(200);
  
  if (girl.level < 100) draw_video();
  
  if (game_state === "GAME_OVER") {
    background(255, 50, 50); 
    
    textSize(100);
    fill(0);
    text("GAME OVER", width/2, height/2);
    draw_text("Press ENTER to restart", 0);
    return; // exit the draw function early so the game stops updating
  }
  

  pop();
  
  detect();
  if (girl.level < 100) {
    girl.update();
  }
  girl.draw_girl();
  console.log(state);
  
  if (girl.level >= 100) {
    girl.state = "CLOSED";
    if (endStage === 0) {
      draw_text("What you looking at?! I'd better press space now!", girl.level);
      soundtrack.stop();
    }

    if (endStage === 1) {
      draw_text("...", girl.level);
    }

    else if (endStage === 2) {
      girl.currentImg = girlImages[2];
      draw_text("You... You didn't like the game?..", girl.level);
    }
    
    else if (endStage === 3) {
      girl.currentImg = girlImages[1];
      draw_text("I really like it, so I hoped you would too...", girl.level);
    }
    
    else if (endStage === 4) {
      girl.currentImg = girlImages[0];
      draw_text("But that is fine. We can play till you learn it.", girl.level);
    }
    
    else if (endStage === 5) {
      draw_text("Let's just start over, shall we?", girl.level);
    }
    
    else if (endStage === 6) {
      girl.currentImg = girlImages[1];
      draw_text("Huh?.. You don't want to?", girl.level);
    }
    
    else if (endStage === 7) {
      draw_text("Well...then...", girl.level);
    }
    
    else if (endStage === 8) {
      endTimer--;
      girl.currentImg = girlImages[0];
      draw_text("Altight. Anyways, we can try again. Let's start over.", girl.level); //mid-sentence abrupt
      if (endTimer <= 0) {
        endStage = 9;
      }
    }

    else if (endStage === 9) {
      girl.triggerJumpscare();
    }
  }
  
  if (screenFlash > 0) {
    fill(255, 0, 0, screenFlash);
    rectMode(CORNER);
    rect(0,0, width, height);
    screenFlash -= 10;
    rectMode(CENTER);
  }
  
  /*if (glitchTimer > 0) {
    filter(INVERT);
    
    // quick random screen shift for extra creepiness
    translate(random(-10, 10), random(-10, 10)); 
    
    glitchTimer--;
  }*/
  
}

// callback function for when handPose outputs data
function gotHands(results) {
  // save the output to the hands variable
  hands = results;
}

function keyPressed() {
  if (game_state === "TUTORIAL") {
    // press SPACE to get through the first 3 reading text boxes
    if (keyCode === 32 && tutorial_step < 3) { 
      tutorial_step++;
      text_counter = 0;
    }
    // press ENTER on the final step to start the game
    if (keyCode === ENTER && tutorial_step === 7) {
      game_state = "START";
      text_counter = 0;
      
      // reset the girl's timer and state to prepare for the first real round
      girl.current_state = 0;
      girl.change_state();
      girl.poseTimer = speed_buffer;
    }
  }
    
  if (keyCode === ENTER) {
    if (game_state === "GAME_OVER") {
      resetGame();
    }
  }
  
  if (game_state === "START" && girl.level >= 100) {
    // press SPACE to get through the text boxes
    if (keyCode === 32 && endStage < 8) { 
      endStage++;
      text_counter = 0;
    }
  }
}