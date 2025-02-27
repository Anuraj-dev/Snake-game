document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const startBtn = document.getElementById("startBtn");
  const scoreElement = document.getElementById("score");
  const highscoreElement = document.getElementById("highscore");

  // Game settings
  const gridSize = 20;
  const tileCount = canvas.width / gridSize;
  const tileCountY = canvas.height / gridSize;
  let speed = 7;

  // Game state
  let gameRunning = false;
  let score = 0;
  let highscore = localStorage.getItem("snakeHighscore") || 0;
  let highscoreBeaten = false;
  highscoreElement.textContent = highscore;

  // Snake initial position and velocity
  let snake = [{ x: 10, y: 10 }];
  let velocityX = 0;
  let velocityY = 0;

  // Direction queue to handle rapid key presses
  let directionQueue = [];

  // Sound effects
  const milestoneSound = new Audio();
  milestoneSound.src = "/sound/milestone.wav";

  const highscoreSound = new Audio();
  highscoreSound.src = "/sound/highscore.wav";

  const gameOverSound = new Audio();
  gameOverSound.src = "/sound/game-over.wav";

  const eatSound = new Audio();
  eatSound.src = "/sound/eat.wav";

  // Snake appearance settings
  const snakeColors = {
    head: "#006400", // Dark green for head
    body: "#32CD32", // Lighter green for body
    bodyAlt: "#228B22", // Alternate green for body segments
    outline: "#004d00", // Dark outline for all segments
    eye: "white",
    pupil: "black",
  };

  // Food initial position and animation properties
  let foodX;
  let foodY;
  let foodRadius = 8;
  let foodRadiusDirection = 0.2;
  let foodMinRadius = 6;
  let foodMaxRadius = 10;

  // Animation frame ID and interval ID
  let animationId;
  let moveIntervalId;

  // Game over effects
  let isGameOverAnimation = false;
  let gameOverOpacity = 0;
  let flashCounter = 0;

  // Generate random food position
  function placeFood() {
    foodX = Math.floor(Math.random() * (tileCount - 2)) + 1;
    foodY = Math.floor(Math.random() * (tileCountY - 2)) + 1;

    // More thorough check to ensure food doesn't spawn on snake
    for (let i = 0; i < snake.length; i++) {
      // Check the exact position and surrounding positions for better safety
      if (
        Math.abs(snake[i].x - foodX) <= 1 &&
        Math.abs(snake[i].y - foodY) <= 1
      ) {
        placeFood();
        return;
      }
    }
  }

  // Simplified game loop function
  function gameLoop() {
    if (!gameRunning && !isGameOverAnimation) return;

    animationId = requestAnimationFrame(gameLoop);
    drawGame();

    // Call handleGameOverAnimation when needed
    if (isGameOverAnimation) {
      handleGameOverAnimation();
    }
  }

  // Separate function to update snake movement at fixed intervals
  function moveSnake() {
    if (!gameRunning) return;

    // Process any queued direction changes
    if (directionQueue.length > 0) {
      const nextDirection = directionQueue.shift();

      // Validate that the direction change is valid (no 180° turns)
      if (
        (nextDirection.x === 0 || velocityX === 0) &&
        (nextDirection.y === 0 || velocityY === 0) &&
        (nextDirection.x !== -velocityX || nextDirection.y !== -velocityY)
      ) {
        velocityX = nextDirection.x;
        velocityY = nextDirection.y;
      }
    }

    updateSnake();
    checkCollision();
  }

  // Update snake position with smoother movement
  function updateSnake() {
    // Create new head based on current direction
    const newHead = {
      x: snake[0].x + velocityX,
      y: snake[0].y + velocityY,
    };

    // Add new head to beginning of snake array
    snake.unshift(newHead);

    // If snake eats food
    if (Math.abs(snake[0].x - foodX) < 1 && Math.abs(snake[0].y - foodY) < 1) {
      //Increase score and update display
      score += 10;
      //Play eat sound if score % 100 != 0
      if (score % 100 != 0) {
        eatSound.play();
      }
      scoreElement.textContent = score;

      // Update highscore if needed
      if (score > highscore) {
        highscore = score;
        highscoreElement.textContent = highscore;
        localStorage.setItem("snakeHighscore", highscore);

        // Play highscore sound if this is first time beating it in this game
        if (!highscoreBeaten) {
          highscoreSound.play();
          highscoreBeaten = true;
        }
      }

      // Play milestone sound every 100 points
      if (score % 100 === 0) {
        milestoneSound.play();
      }

      placeFood();

      // Increase speed slightly when score is multiple of 50
      if (score % 50 === 0 && speed < 15) {
        speed += 1;
        // Update movement interval for new speed
        clearInterval(moveIntervalId);
        moveIntervalId = setInterval(moveSnake, 1000 / speed);
      }
    } else {
      // Remove tail if no food was eaten
      snake.pop();
    }
  }

  // Improved collision detection
  function checkCollision() {
    // Wall collision with more precise bounds checking
    if (
      snake[0].x < 0 ||
      snake[0].x >= tileCount ||
      snake[0].y < 0 ||
      snake[0].y >= tileCountY
    ) {
      triggerGameOver();
      return;
    }

    // Self collision with improved detection
    for (let i = 1; i < snake.length; i++) {
      if (
        Math.abs(snake[i].x - snake[0].x) < 0.5 &&
        Math.abs(snake[i].y - snake[0].y) < 0.5
      ) {
        triggerGameOver();
        return;
      }
    }
  }

  // Enhanced game over function with visual feedback
  function triggerGameOver() {
    gameRunning = false;
    isGameOverAnimation = true;
    gameOverOpacity = 0;
    flashCounter = 0;

    // Play game over sound
    gameOverSound.play();

    // Clear the movement interval when game is over
    clearInterval(moveIntervalId);

    // Clear direction queue
    directionQueue = [];

    // Make sure start button is visible after game over
    startBtn.disabled = false;
    startBtn.textContent = "Restart Game";
  }

  // Handle game over animation
  function handleGameOverAnimation() {
    flashCounter++;

    // End animation after flashing
    if (flashCounter > 10) {
      isGameOverAnimation = false;
      cancelAnimationFrame(animationId);

      // Show game over dialog after animation completes
      setTimeout(() => {
        alert(`Game Over! Your score: ${score}`);
      }, 100);
    }
  }

  // Draw grid dots to help with navigation
  function drawGridDots() {
    const dotSize = 1; // Small dot size
    const dotColor = "rgba(0, 0, 0, 0.2)"; // Subtle dark color with low opacity

    ctx.fillStyle = dotColor;

    // Draw dots at grid intersections
    for (let x = 0; x <= tileCount; x++) {
      for (let y = 0; y <= tileCountY; y++) {
        ctx.beginPath();
        ctx.arc(x * gridSize, y * gridSize, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Draw game elements with enhanced visuals
  function drawGame() {
    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add grid dots for easier navigation
    drawGridDots();

    // Update food radius for blinking effect
    foodRadius += foodRadiusDirection;
    if (foodRadius >= foodMaxRadius || foodRadius <= foodMinRadius) {
      foodRadiusDirection *= -1;
    }

    // Draw food as a blinking circle with gradient
    const foodGradient = ctx.createRadialGradient(
      foodX * gridSize + gridSize / 2,
      foodY * gridSize + gridSize / 2,
      1,
      foodX * gridSize + gridSize / 2,
      foodY * gridSize + gridSize / 2,
      foodRadius
    );
    foodGradient.addColorStop(0, "#ff0000");
    foodGradient.addColorStop(1, "#990000");

    ctx.beginPath();
    ctx.arc(
      foodX * gridSize + gridSize / 2,
      foodY * gridSize + gridSize / 2,
      foodRadius,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = foodGradient;
    ctx.fill();
    ctx.closePath();

    // Add a shine effect to the food
    ctx.beginPath();
    ctx.arc(
      foodX * gridSize + gridSize / 3,
      foodY * gridSize + gridSize / 3,
      foodRadius / 4,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fill();
    ctx.closePath();

    // Draw snake with realistic appearance
    for (let i = 0; i < snake.length; i++) {
      const isHead = i === 0;
      const segment = snake[i];
      const nextSegment = snake[i + 1] || null;
      const prevSegment = snake[i - 1] || null;

      // Choose segment color based on position
      let fillColor = isHead
        ? snakeColors.head
        : i % 2 === 0
        ? snakeColors.body
        : snakeColors.bodyAlt;

      // Draw the snake segment
      drawSnakeSegment(segment, nextSegment, prevSegment, isHead, fillColor);
    }

    // Draw game over effect if needed
    if (isGameOverAnimation) {
      const flashOn = flashCounter % 2 === 0;
      if (flashOn) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }

  // Function to draw a snake segment with proper connections
  function drawSnakeSegment(
    segment,
    nextSegment,
    prevSegment,
    isHead,
    fillColor
  ) {
    const x = segment.x * gridSize;
    const y = segment.y * gridSize;
    const size = gridSize - 1;
    const radius = gridSize / 3;

    ctx.fillStyle = fillColor;

    if (isHead) {
      // Draw a rounded rectangle for the head
      roundedRect(x, y, size, size, radius);

      // Add eyes to the head
      const eyeSize = gridSize / 5;
      const eyeOffset = gridSize / 4;

      // Determine eye positions based on direction
      let leftEyeX = x + eyeOffset;
      let leftEyeY = y + eyeOffset;
      let rightEyeX = x + size - eyeOffset * 1.5;
      let rightEyeY = y + eyeOffset;

      if (velocityY === -1) {
        // Moving up
        leftEyeX = x + eyeOffset;
        leftEyeY = y + eyeOffset;
        rightEyeX = x + size - eyeOffset * 1.5;
        rightEyeY = y + eyeOffset;
      } else if (velocityY === 1) {
        // Moving down
        leftEyeX = x + eyeOffset;
        leftEyeY = y + size - eyeOffset * 1.5;
        rightEyeX = x + size - eyeOffset * 1.5;
        rightEyeY = y + size - eyeOffset * 1.5;
      } else if (velocityX === -1) {
        // Moving left
        leftEyeX = x + eyeOffset;
        leftEyeY = y + eyeOffset;
        rightEyeX = x + eyeOffset;
        rightEyeY = y + size - eyeOffset * 1.5;
      } else {
        // Moving right or default
        leftEyeX = x + size - eyeOffset * 1.5;
        leftEyeY = y + eyeOffset;
        rightEyeX = x + size - eyeOffset * 1.5;
        rightEyeY = y + size - eyeOffset * 1.5;
      }

      // Draw eyes
      ctx.fillStyle = snakeColors.eye;
      ctx.beginPath();
      ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
      ctx.fill();

      // Draw pupils
      ctx.fillStyle = snakeColors.pupil;
      ctx.beginPath();
      ctx.arc(leftEyeX, leftEyeY, eyeSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX, rightEyeY, eyeSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Draw body segment with rounded corners
      roundedRect(x, y, size, size, radius);
    }
  }

  // Helper function to draw rounded rectangles
  function roundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    // Add outline
    ctx.strokeStyle = snakeColors.outline;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Improved keyboard input handling with direction queue
  document.addEventListener("keydown", (e) => {
    if (!gameRunning) return;

    // Process directional inputs
    switch (e.key) {
      case "ArrowUp":
        // Only queue if not already moving in opposite direction
        if (velocityY !== 1) {
          directionQueue.push({ x: 0, y: -1 });
          e.preventDefault();
        }
        break;
      case "ArrowDown":
        if (velocityY !== -1) {
          directionQueue.push({ x: 0, y: 1 });
          e.preventDefault();
        }
        break;
      case "ArrowLeft":
        if (velocityX !== 1) {
          directionQueue.push({ x: -1, y: 0 });
          e.preventDefault();
        }
        break;
      case "ArrowRight":
        if (velocityX !== -1) {
          directionQueue.push({ x: 1, y: 0 });
          e.preventDefault();
        }
        break;
    }

    // Limit queue size to prevent excessive inputs
    if (directionQueue.length > 3) {
      directionQueue = directionQueue.slice(-3);
    }
  });

  // Start game function
  function startGame() {
    // Reset game state with just 1 block for the snake
    snake = [{ x: 10, y: 10 }];

    // Set initial direction and ensure it's applied immediately
    velocityX = 1;
    velocityY = 0;

    // Reset score and related variables
    score = 0;
    speed = 7;
    highscoreBeaten = false;
    scoreElement.textContent = "0";
    isGameOverAnimation = false;

    // Clear direction queue
    directionQueue = [];

    // Place first food
    placeFood();

    // Start game loop with separate animation and movement timers
    gameRunning = true;

    // Clear any existing timers
    cancelAnimationFrame(animationId);
    clearInterval(moveIntervalId);

    // Start the rendering loop (for smooth visuals)
    animationId = requestAnimationFrame(gameLoop);

    // Start the movement update interval (for consistent game speed)
    moveIntervalId = setInterval(moveSnake, 1000 / speed);

    // Disable button during gameplay
    startBtn.disabled = true;
  }

  // Add start button click handler
  startBtn.addEventListener("click", startGame);

  // Initial draw
  drawGame();
});
