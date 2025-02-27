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

  // Food initial position and animation properties
  let foodX;
  let foodY;
  let foodRadius = 8;
  let foodRadiusDirection = 0.2;
  let foodMinRadius = 6;
  let foodMaxRadius = 10;

  // Animation frame ID
  let animationId;

  // Generate random food position
  function placeFood() {
    foodX = Math.floor(Math.random() * (tileCount - 2)) + 1;
    foodY = Math.floor(Math.random() * (tileCountY - 2)) + 1;

    // Make sure food doesn't spawn on snake
    for (let i = 0; i < snake.length; i++) {
      if (snake[i].x === foodX && snake[i].y === foodY) {
        placeFood();
        break;
      }
    }
  }

  // Game loop function
  function gameLoop() {
    if (!gameRunning) return;

    animationId = requestAnimationFrame(gameLoop);

    // Slow down the game loop to match speed
    const now = Date.now();
    if (now - lastTime >= 1000 / speed) {
      lastTime = now;
      updateSnake();
      checkCollision();
      drawGame();
    }
  }

  let lastTime = 0;

  // Update snake position
  function updateSnake() {
    // Create new head based on current direction
    const newHead = {
      x: snake[0].x + velocityX,
      y: snake[0].y + velocityY,
    };

    // Add new head to beginning of snake array
    snake.unshift(newHead);

    // If snake eats food
    if (snake[0].x === foodX && snake[0].y === foodY) {
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

  // Check for collisions
  function checkCollision() {
    // Wall collision
    if (
      snake[0].x < 0 ||
      snake[0].x >= tileCount ||
      snake[0].y < 0 ||
      snake[0].y >= tileCountY
    ) {
      gameOver();
    }

    // Self collision (start at 1 to skip head)
    for (let i = 1; i < snake.length; i++) {
      if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
        gameOver();
      }
    }
  }

  // Game over function
  function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    alert(`Game Over! Your score: ${score}`);
    startBtn.textContent = "Restart Game";
    startBtn.disabled = false;
  }

  // Draw game elements
  function drawGame() {
    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update food radius for blinking effect
    foodRadius += foodRadiusDirection;
    if (foodRadius >= foodMaxRadius || foodRadius <= foodMinRadius) {
      foodRadiusDirection *= -1;
    }

    // Draw food as a blinking circle
    ctx.beginPath();
    ctx.arc(
      foodX * gridSize + gridSize / 2,
      foodY * gridSize + gridSize / 2,
      foodRadius,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();

    // Draw snake
    ctx.fillStyle = "green";
    for (let i = 0; i < snake.length; i++) {
      ctx.fillRect(
        snake[i].x * gridSize,
        snake[i].y * gridSize,
        gridSize - 1,
        gridSize - 1
      );
    }
  }

  // Handle keyboard input
  document.addEventListener("keydown", (e) => {
    if (!gameRunning) return;

    // Prevent reversing direction directly
    switch (e.key) {
      case "ArrowUp":
        if (velocityY !== 1) {
          // Not moving down
          velocityX = 0;
          velocityY = -1;
        }
        break;
      case "ArrowDown":
        if (velocityY !== -1) {
          // Not moving up
          velocityX = 0;
          velocityY = 1;
        }
        break;
      case "ArrowLeft":
        if (velocityX !== 1) {
          // Not moving right
          velocityX = -1;
          velocityY = 0;
        }
        break;
      case "ArrowRight":
        if (velocityX !== -1) {
          // Not moving left
          velocityX = 1;
          velocityY = 0;
        }
        break;
    }
  });

  // Start game function
  function startGame() {
    // Reset game state
    snake = [{ x: 10, y: 10 }];
    velocityX = 1;
    velocityY = 0;
    score = 0;
    speed = 7;
    scoreElement.textContent = "0";

    // Place first food
    placeFood();

    // Start game loop
    gameRunning = true;
    lastTime = Date.now();
    cancelAnimationFrame(animationId);
    gameLoop();

    // Disable button during gameplay
    startBtn.disabled = true;
  }

  // Add start button click handler
  startBtn.addEventListener("click", startGame);

  // Initial draw
  drawGame();
});
