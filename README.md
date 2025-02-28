# 🐍 Enhanced Snake Game

## 📖 Introduction

Welcome to my upgraded Snake Game! This modern take on the classic arcade game features multiple difficulty levels, bonus food, and visual effects. Control a snake to eat food, grow longer, and chase high scores while avoiding collisions with walls or yourself.

## 🎮 Game Features

- **Menu System** - Select difficulty, view highscores, and control gameplay
- **Multiple Difficulty Levels** - Easy, Normal, and Hard modes with different speeds
- **Dynamic Speed Progression** - Snake accelerates as your score increases
- **Bonus Food System** - Special bonus food appears randomly for extra points
- **High Score Tracking** - Local storage saves your best scores
- **Dramatic Game Over Effects** - Vibrating screen with red flashing effects
- **Pause & Resume** - Press ESC anytime to pause and continue later

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

1. **Clone or download the repository**

   ```
   git clone https://github.com/yourusername/snake-game.git
   ```

   Or simply download the ZIP file and extract it.

2. **Launch the game**
   Open the `index.html` file in your browser.

## 🕹️ How to Play

1. **Starting the game**: Click "New Game" in the menu
2. **Controls**: Use arrow keys (↑, ↓, ←, →) to control the snake
3. **Scoring**:
   - Red food = 10 points
   - Golden bonus food = Variable points (catch quickly before value decreases!)
4. **Pause**: Press ESC key to pause the game anytime
5. **Game Over**: Occurs when hitting walls or your own body

## 🎛️ Difficulty Levels

- **Easy**: Slower initial speed, smaller speed increases
- **Normal**: Moderate speed with steady progression
- **Hard**: Fast initial speed with bigger speed increases

You can change the difficulty level from the pause menu during gameplay. The new speed will be applied when you resume!

## 💾 File Structure

- `index.html`: Main HTML document with game layout and menu structure
- `styles.css`: All styling including menu, animations, and game elements
- `game.js`: Core game logic with snake movement, collision detection, menu system and visual effects

## 🔧 Customization Options

Some parts you might want to customize:

- Snake and food colors in the snakeColors object
- Difficulty settings (speed, bonus frequency) in the difficulties object
- Game over animation duration and intensity
- Canvas size for varying the play area

Enjoy the enhanced Snake gaming experience! 🎮
