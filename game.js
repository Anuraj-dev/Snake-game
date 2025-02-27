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
  highscoreElement.textContent = highscore;

  // Snake initial position and velocity
  let snake = [{ x: 10, y: 10 }];
  let velocityX = 0;
  let velocityY = 0;

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

  // FIXED: Simplified game loop function
  function gameLoop() {
    if (!gameRunning && !isGameOverAnimation) return;

    animationId = requestAnimationFrame(gameLoop);
    drawGame();
  }

  // FIXED: Separate function to update snake movement at fixed intervals
  function moveSnake() {
    if (!gameRunning) return;

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
      score += 10;
      scoreElement.textContent = score;

      // Update highscore if needed
      if (score > highscore) {
        highscore = score;
        highscoreElement.textContent = highscore;
        localStorage.setItem("snakeHighscore", highscore);
      }

      placeFood();

      // Increase speed slightly when score is multiple of 50
      if (score % 50 === 0 && speed < 15) {
        speed += 1;
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

    // FIXED: Clear the movement interval when game is over
    clearInterval(moveIntervalId);
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
        startBtn.textContent = "Restart Game";
        startBtn.disabled = false;
      }, 100);
    }
  }

  // Draw game elements with enhanced visuals
  function drawGame() {
    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    // FIXED: Added debug info to verify snake position
    if (gameRunning) {
      ctx.fillStyle = "black";
      ctx.font = "12px Arial";
      ctx.fillText(
        `Head: x=${snake[0].x.toFixed(1)}, y=${snake[0].y.toFixed(1)}`,
        10,
        20
      );
      ctx.fillText(`Velocity: x=${velocityX}, y=${velocityY}`, 10, 40);
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

  // Improved keyboard input handling with prevention of multiple presses
  let lastKeyTime = 0;
  const keyDelay = 50; // ms delay between key presses

  document.addEventListener("keydown", (e) => {
    if (!gameRunning) return;

    // Prevent key spamming
    const now = Date.now();
    if (now - lastKeyTime < keyDelay) return;
    lastKeyTime = now;

    // Get the current direction to prevent 180° turns
    const currentDirectionX = velocityX;
    const currentDirectionY = velocityY;

    // Prevent reversing direction directly
    switch (e.key) {
      case "ArrowUp":
        if (currentDirectionY !== 1) {
          // Not moving down
          velocityX = 0;
          velocityY = -1;
          e.preventDefault();
        }
        break;
      case "ArrowDown":
        if (currentDirectionY !== -1) {
          // Not moving up
          velocityX = 0;
          velocityY = 1;
          e.preventDefault();
        }
        break;
      case "ArrowLeft":
        if (currentDirectionX !== 1) {
          // Not moving right
          velocityX = -1;
          velocityY = 0;
          e.preventDefault();
        }
        break;
      case "ArrowRight":
        if (currentDirectionX !== -1) {
          // Not moving left
          velocityX = 1;
          velocityY = 0;
          e.preventDefault();
        }
        break;
    }
  });

  // FIXED: Start game function
  function startGame() {
    // Reset game state
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];

    // FIXED: Set initial direction and ensure it's applied immediately
    velocityX = 1;
    velocityY = 0;

    score = 0;
    speed = 7;
    scoreElement.textContent = "0";
    isGameOverAnimation = false;

    // Place first food
    placeFood();

    // FIXED: Start game loop with separate animation and movement timers
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

    // FIXED: Force an initial movement to ensure the snake starts moving
    updateSnake();
  }

  // Add start button click handler
  startBtn.addEventListener("click", startGame);

  // Initial draw
  drawGame();
});
