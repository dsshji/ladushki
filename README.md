# Ladushki

A camera-controlled game built with [p5.js](https://p5js.org/) and [ml5.js](https://ml5js.org/), created for an Intro to Interactive Media course at NYU Abu Dhabi.

**[▶ Play the game](https://editor.p5js.org/dsshji/full/_nVDok-Ie)**

> **Note:** You'll need to grant camera access to play.

## About

*Ladushki* (Ладушки) is a Russian children's clapping game — similar to Patty Cake — where players match their partner's rhythm and hand positions. In this digital version, a pixel-art girl challenges you to play along. Match her claps correctly to keep her happy. Fail too many times, and things get... unsettling.

As your mistake count rises, the girl gets angrier, her clapping speeds up, and the environment around her begins to distort — visually and sonically. What happens when she reaches the boiling point? Play and find out.

## How to Play

Show your hands to your camera and mirror the girl's hand positions:
- **Right hand open** → match with your right
- **Left hand open** → match with your left
- **Both hands open** → match both

Follow the in-game tutorial for the full rules. Press **Enter** to restart after game over.

## Technical Highlights

### Hand Tracking (ml5.js HandPose)
Hand detection uses the [ml5.js HandPose model](https://docs.ml5js.org/#/reference/handpose). Open/closed palm state is determined by checking finger-tip keypoint positions relative to knuckles, with an additional check comparing the distance between the thumb and pinky tips to confirm a fully open, forward-facing palm.

### Sound & Distortion
Background music speed and distortion intensity are mapped to the player's anger level using p5.sound's `rate()`, `distortion.set()`, and `drywet()` methods, creating a gradual, barely-noticeable sonic deterioration.

### Typewriter Dialogue
A typewriter text effect renders dialogue letter-by-letter using a frame counter divided by a speed constant and a `substring()` call. At higher anger levels, the dialogue box shakes using randomized `translate()` offsets.

### Style Isolation
All draw functions use `push()` / `pop()` to isolate styles and prevent global `imageMode`, `rectMode`, and `textAlign` settings from bleeding across components.

## Assets

| Asset | Source |
|-------|--------|
| Character sprites | [Picrew](https://picrew.me/en/image_maker/2308695) → pixelated with Nano Banana → edited in Canva |
| Background music | Generated with [Suno AI](https://suno.com/) |
| Clapping & other sounds | [Pixabay](https://pixabay.com/de/sound-effects/) (royalty-free) |

## Built With

- [p5.js](https://p5js.org/reference/)
- [ml5.js HandPose](https://docs.ml5js.org/#/reference/handpose)
- [The Coding Train HandPose tutorial](https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose)
