document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const scoreElement = document.getElementById("score");
  const highscoreElement = document.getElementById("highscore");

  // Menu elements
  const menuOverlay = document.getElementById("menuOverlay");
  const mainMenu = document.getElementById("mainMenu");
  const difficultyMenu = document.getElementById("difficultyMenu");
  const highscoreMenu = document.getElementById("highscoreMenu");
  const newGameBtn = document.getElementById("newGameBtn");
  const continueBtn = document.getElementById("continueBtn");
  const difficultyBtn = document.getElementById("difficultyBtn");
  const highscoreBtn = document.getElementById("highscoreBtn");
  const easyBtn = document.getElementById("easyBtn");
  const normalBtn = document.getElementById("normalBtn");
  const hardBtn = document.getElementById("hardBtn");
  const difficultyBackBtn = document.getElementById("difficultyBackBtn");
  const resetHighscoreBtn = document.getElementById("resetHighscoreBtn");
  const highscoreBackBtn = document.getElementById("highscoreBackBtn");
  const menuHighscoreElement = document.getElementById("menuHighscore");

  // Game settings
  const gridSize = 20;
  const tileCount = canvas.width / gridSize;
  const tileCountY = canvas.height / gridSize;

  // Difficulty settings
  const difficulties = {
    easy: { initialSpeed: 5, speedIncrement: 0.5, bonusFrequency: 200 },
    normal: { initialSpeed: 7, speedIncrement: 1, bonusFrequency: 150 },
    hard: { initialSpeed: 10, speedIncrement: 1.5, bonusFrequency: 120 },
  };

  let currentDifficulty = localStorage.getItem("snakeDifficulty") || "normal";
  let speed = difficulties[currentDifficulty].initialSpeed;

  // Game state
  let gameRunning = false;
  let isPaused = false;
  let gameInitialized = false; // New flag to track if the game has been initialized
  let score = 0;
  let highscore = localStorage.getItem("snakeHighscore") || 0;
  let highscoreBeaten = false;
  highscoreElement.textContent = highscore;
  menuHighscoreElement.textContent = highscore;

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

  // Add bonus food sound
  const bonusFoodSound = new Audio();
  bonusFoodSound.src = "/sound/bonus-food.wav";

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

  // Bonus food properties
  let bonusFoodX;
  let bonusFoodY;
  let isBonusFoodActive = false;
  let bonusFoodTimer = 0;
  let bonusFoodMaxTime = 10; // 10 seconds lifetime
  let bonusFoodMaxValue = 100; // Starting points value
  let bonusFoodMinValue = 10; // Minimum points value
  let bonusFoodValue = bonusFoodMaxValue; // Current points value
  let bonusFoodSize = 30; // Starting size
  let bonusFoodMinSize = 10; // Minimum size before disappearing
  let bonusIntervalCounter = 0;
  let bonusSpawnInterval = difficulties[currentDifficulty].bonusFrequency;

  // Animation frame ID and interval ID
  let animationId;
  let moveIntervalId;

  // Delta timing variable for gameLoop
  let lastTime = performance.now();

  // Game over effects
  let isGameOverAnimation = false;
  let gameOverOpacity = 0;
  let flashCounter = 0;
  let showGameOverMessage = false;

  // Enhanced menu handler functions
  function showMenu() {
    menuOverlay.classList.add("active");
    updateDifficultySelection();
    menuHighscoreElement.textContent = highscore;

    // Show "Continue Game" button only if a game is in progress
    if (gameRunning && !showGameOverMessage) {
      continueBtn.classList.remove("hidden");
    } else {
      continueBtn.classList.add("hidden");
    }
  }

  function hideMenu() {
    menuOverlay.classList.remove("active");
    showPanel(mainMenu);
  }

  function showPanel(panel) {
    // Hide all panels
    mainMenu.classList.remove("active");
    difficultyMenu.classList.remove("active");
    highscoreMenu.classList.remove("active");

    // Show the requested panel
    panel.classList.add("active");
  }

  // Improved pause/resume functions
  function pauseGame() {
    if (!gameRunning || showGameOverMessage) return;

    isPaused = true;
    clearInterval(moveIntervalId);
    cancelAnimationFrame(animationId);
    showMenu();
  }

  function resumeGame() {
    if (!gameRunning || showGameOverMessage) return;

    isPaused = false;
    hideMenu();
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
    moveIntervalId = setInterval(moveSnake, 1000 / speed);
  }

  function updateDifficultySelection() {
    // Remove selected class from all difficulty buttons
    easyBtn.classList.remove("selected");
    normalBtn.classList.remove("selected");
    hardBtn.classList.remove("selected");

    // Add selected class to current difficulty
    if (currentDifficulty === "easy") {
      easyBtn.classList.add("selected");
    } else if (currentDifficulty === "normal") {
      normalBtn.classList.add("selected");
    } else if (currentDifficulty === "hard") {
      hardBtn.classList.add("selected");
    }
  }

  function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    localStorage.setItem("snakeDifficulty", difficulty);
    bonusSpawnInterval = difficulties[difficulty].bonusFrequency;
    updateDifficultySelection();
    showPanel(mainMenu);
  }

  function resetHighscore() {
    if (confirm("Are you sure you want to reset the highscore?")) {
      highscore = 0;
      localStorage.removeItem("snakeHighscore");
      highscoreElement.textContent = "0";
      menuHighscoreElement.textContent = "0";
    }
  }

  // Generate random food position without recursion
  function placeFood() {
    let valid = false;
    while (!valid) {
      foodX = Math.floor(Math.random() * (tileCount - 2)) + 1;
      foodY = Math.floor(Math.random() * (tileCountY - 2)) + 1;
      valid = true;
      for (let i = 0; i < snake.length; i++) {
        if (
          Math.abs(snake[i].x - foodX) <= 1 &&
          Math.abs(snake[i].y - foodY) <= 1
        ) {
          valid = false;
          break;
        }
      }
    }
  }

  // Generate random bonus food position without recursion
  function placeBonusFood() {
    if (isBonusFoodActive) return;
    let valid = false;
    while (!valid) {
      bonusFoodX = Math.floor(Math.random() * (tileCount - 2)) + 1;
      bonusFoodY = Math.floor(Math.random() * (tileCountY - 2)) + 1;
      valid = true;
      for (let i = 0; i < snake.length; i++) {
        if (
          (Math.abs(snake[i].x - bonusFoodX) < 1 &&
            Math.abs(snake[i].y - bonusFoodY) < 1) ||
          (Math.abs(foodX - bonusFoodX) < 1 && Math.abs(foodY - bonusFoodY) < 1)
        ) {
          valid = false;
          break;
        }
      }
    }
    isBonusFoodActive = true;
    bonusFoodTimer = bonusFoodMaxTime;
    bonusFoodValue = bonusFoodMaxValue; // Start with max value
    bonusFoodSize = 30;
  }

  // Simplified game loop function using delta timing
  function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000; // seconds
    lastTime = currentTime;

    if (!gameRunning || isPaused || isGameOverAnimation) {
      if (isGameOverAnimation) {
        handleGameOverAnimation();
        drawGame();
      }
      return;
    }

    animationId = requestAnimationFrame(gameLoop);
    drawGame();
    updateBonusFood(deltaTime);
  }

  // Separate function to update snake movement at fixed intervals
  function moveSnake() {
    if (!gameRunning || isPaused) return;

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

    // Handle bonus food spawn logic
    bonusIntervalCounter++;

    if (bonusIntervalCounter >= bonusSpawnInterval && !isBonusFoodActive) {
      if (Math.random() < 0.15) {
        placeBonusFood();
        bonusIntervalCounter = 0;
      }
    }
  }

  // Update snake position with smoother movement
  function updateSnake() {
    const newHead = {
      x: snake[0].x + velocityX,
      y: snake[0].y + velocityY,
    };

    snake.unshift(newHead);

    if (Math.abs(snake[0].x - foodX) < 1 && Math.abs(snake[0].y - foodY) < 1) {
      const previousScore = score;
      score += 10;
      if (score % 100 != 0) {
        eatSound.play();
      }
      scoreElement.textContent = score;

      if (score > highscore) {
        highscore = score;
        highscoreElement.textContent = highscore;
        menuHighscoreElement.textContent = highscore;
        localStorage.setItem("snakeHighscore", highscore);
        if (!highscoreBeaten) {
          highscoreSound.play();
          highscoreBeaten = true;
        }
      }

      if (score % 100 === 0) {
        milestoneSound.play();
      }

      placeFood();

      if (score % 50 === 0 && speed < 15) {
        speed += difficulties[currentDifficulty].speedIncrement;
        clearInterval(moveIntervalId);
        moveIntervalId = setInterval(moveSnake, 1000 / speed);
      }
    } else if (
      isBonusFoodActive &&
      Math.abs(snake[0].x - bonusFoodX) < 1 &&
      Math.abs(snake[0].y - bonusFoodY) < 1
    ) {
      const previousScore = score;
      score += bonusFoodValue;
      scoreElement.textContent = score;

      const crossedMilestone =
        Math.floor(previousScore / 100) < Math.floor(score / 100);

      bonusFoodSound.play();

      if (score > highscore) {
        highscore = score;
        highscoreElement.textContent = highscore;
        menuHighscoreElement.textContent = highscore;
        localStorage.setItem("snakeHighscore", highscore);
        if (!highscoreBeaten) {
          highscoreSound.play();
          highscoreBeaten = true;
        }
      }
      isBonusFoodActive = false;
    } else {
      snake.pop();
    }
  }

  // Improved collision detection
  function checkCollision() {
    if (
      snake[0].x < 0 ||
      snake[0].x >= tileCount ||
      snake[0].y < 0 ||
      snake[0].y >= tileCountY
    ) {
      triggerGameOver();
      return;
    }

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
    showGameOverMessage = false;
    gameOverSound.play();
    clearInterval(moveIntervalId);
    directionQueue = [];

    // Show the menu after a short delay to allow the game over animation
    setTimeout(() => {
      showGameOverMessage = true;
      showMenu();
    }, 1500);
  }

  // Handle game over animation
  function handleGameOverAnimation() {
    flashCounter++;
    if (flashCounter > 10) {
      isGameOverAnimation = false;
      showGameOverMessage = true;
      cancelAnimationFrame(animationId);
      requestAnimationFrame(drawGame);
    }
  }

  // Draw grid dots to help with navigation
  function drawGridDots() {
    const dotSize = 1;
    const dotColor = "rgba(0, 0, 0, 0.2)";
    ctx.fillStyle = dotColor;
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
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGridDots();

    if (!showGameOverMessage) {
      drawBonusFoodTimer();

      foodRadius += foodRadiusDirection;
      if (foodRadius >= foodMaxRadius || foodRadius <= foodMinRadius) {
        foodRadiusDirection *= -1;
      }

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

      drawBonusFood();

      for (let i = 0; i < snake.length; i++) {
        const isHead = i === 0;
        const segment = snake[i];
        const nextSegment = snake[i + 1] || null;
        const prevSegment = snake[i - 1] || null;
        let fillColor = isHead
          ? snakeColors.head
          : i % 2 === 0
          ? snakeColors.body
          : snakeColors.bodyAlt;
        drawSnakeSegment(segment, nextSegment, prevSegment, isHead, fillColor);
      }

      if (isGameOverAnimation) {
        const flashOn = flashCounter % 2 === 0;
        if (flashOn) {
          ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    } else {
      ctx.globalAlpha = 0.2;
      for (let i = 0; i < snake.length; i++) {
        const isHead = i === 0;
        const segment = snake[i];
        const nextSegment = snake[i + 1] || null;
        const prevSegment = snake[i - 1] || null;
        let fillColor = isHead
          ? snakeColors.head
          : i % 2 === 0
          ? snakeColors.body
          : snakeColors.bodyAlt;
        drawSnakeSegment(segment, nextSegment, prevSegment, isHead, fillColor);
      }
      ctx.globalAlpha = 1.0;
    }
    displayGameMessages();
  }

  // Draw bonus food
  function drawBonusFood() {
    if (!isBonusFoodActive) return;
    const bonusFoodGradient = ctx.createRadialGradient(
      bonusFoodX * gridSize + gridSize / 2,
      bonusFoodY * gridSize + gridSize / 2,
      1,
      bonusFoodX * gridSize + gridSize / 2,
      bonusFoodY * gridSize + gridSize / 2,
      bonusFoodSize
    );
    bonusFoodGradient.addColorStop(0, "#ffcc00");
    bonusFoodGradient.addColorStop(0.7, "#ff6600");
    bonusFoodGradient.addColorStop(1, "#ff3300");

    ctx.beginPath();
    ctx.arc(
      bonusFoodX * gridSize + gridSize / 2,
      bonusFoodY * gridSize + gridSize / 2,
      bonusFoodSize,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = bonusFoodGradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    const sparkleAngle = (Date.now() / 200) % (Math.PI * 2);
    const sparkleX =
      bonusFoodX * gridSize +
      gridSize / 2 +
      Math.cos(sparkleAngle) * bonusFoodSize * 0.7;
    const sparkleY =
      bonusFoodY * gridSize +
      gridSize / 2 +
      Math.sin(sparkleAngle) * bonusFoodSize * 0.7;
    ctx.beginPath();
    ctx.arc(sparkleX, sparkleY, bonusFoodSize / 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fill();
    ctx.closePath();
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
      roundedRect(x, y, size, size, radius);

      const eyeSize = gridSize / 5;
      const eyeOffset = gridSize / 4;

      let leftEyeX = x + eyeOffset;
      let leftEyeY = y + eyeOffset;
      let rightEyeX = x + size - eyeOffset * 1.5;
      let rightEyeY = y + eyeOffset;

      if (velocityY === -1) {
        leftEyeX = x + eyeOffset;
        leftEyeY = y + eyeOffset;
        rightEyeX = x + size - eyeOffset * 1.5;
        rightEyeY = y + eyeOffset;
      } else if (velocityY === 1) {
        leftEyeX = x + eyeOffset;
        leftEyeY = y + size - eyeOffset * 1.5;
        rightEyeX = x + size - eyeOffset * 1.5;
        rightEyeY = y + size - eyeOffset * 1.5;
      } else if (velocityX === -1) {
        leftEyeX = x + eyeOffset;
        leftEyeY = y + eyeOffset;
        rightEyeX = x + eyeOffset;
        rightEyeY = y + size - eyeOffset * 1.5;
      } else {
        leftEyeX = x + size - eyeOffset * 1.5;
        leftEyeY = y + eyeOffset;
        rightEyeX = x + size - eyeOffset * 1.5;
        rightEyeY = y + size - eyeOffset * 1.5;
      }

      ctx.fillStyle = snakeColors.eye;
      ctx.beginPath();
      ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = snakeColors.pupil;
      ctx.beginPath();
      ctx.arc(leftEyeX, leftEyeY, eyeSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX, rightEyeY, eyeSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
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

    ctx.strokeStyle = snakeColors.outline;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Merged keyboard input handling for direction, pausing, and restarting
  document.addEventListener("keydown", (e) => {
    // ESC key for pausing/resuming
    if (e.key === "Escape" || e.key === "Esc") {
      if (gameRunning) {
        if (isPaused) {
          resumeGame();
        } else {
          pauseGame();
        }
      }
      e.preventDefault();
      return;
    }

    // Enter key for restarting after game over
    if (e.key === "Enter" && showGameOverMessage) {
      hideMenu();
      startGame();
      return;
    }

    // If game is paused or not running, don't process movement keys
    if (!gameRunning || isPaused) return;

    switch (e.key) {
      case "ArrowUp":
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
    if (directionQueue.length > 3) {
      directionQueue = directionQueue.slice(-3);
    }
  });

  // Improved start game function
  function startGame() {
    // Initialize food position if not already done
    if (!gameInitialized) {
      placeFood();
      gameInitialized = true;
    }

    snake = [{ x: 10, y: 10 }];
    velocityX = 1;
    velocityY = 0;
    score = 0;
    speed = difficulties[currentDifficulty].initialSpeed;
    highscoreBeaten = false;
    scoreElement.textContent = "0";
    isGameOverAnimation = false;
    showGameOverMessage = false;
    directionQueue = [];
    isBonusFoodActive = false;
    bonusIntervalCounter = 0;

    // Clear any existing game loops
    cancelAnimationFrame(animationId);
    clearInterval(moveIntervalId);

    // Start new game loops
    gameRunning = true;
    isPaused = false;
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
    moveIntervalId = setInterval(moveSnake, 1000 / speed);

    // Hide menu when game starts
    hideMenu();
  }

  // Initial draw
  drawGame();

  // Update bonus food state with delta timing
  function updateBonusFood(deltaTime) {
    if (!isBonusFoodActive) return;
    bonusFoodTimer -= deltaTime;
    const rawValue =
      bonusFoodMinValue +
      (bonusFoodMaxValue - bonusFoodMinValue) *
        (bonusFoodTimer / bonusFoodMaxTime);
    bonusFoodValue = Math.max(
      bonusFoodMinValue,
      Math.min(bonusFoodMaxValue, Math.round(rawValue / 10) * 10)
    );
    const timeRatio = bonusFoodTimer / bonusFoodMaxTime;
    bonusFoodSize = bonusFoodMinSize + (12 - bonusFoodMinSize) * timeRatio;
    if (bonusFoodTimer <= 0) {
      isBonusFoodActive = false;
    }
  }

  // Function to draw the bonus food timer bar (show status)
  function drawBonusFoodTimer() {
    if (!isBonusFoodActive) return;
    const timeRatio = bonusFoodTimer / bonusFoodMaxTime;
    const barWidth = canvas.width * timeRatio;
    const barHeight = 5;
    ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
    ctx.fillRect(0, 0, canvas.width, barHeight);
    const timerGradient = ctx.createLinearGradient(0, 0, barWidth, 0);
    timerGradient.addColorStop(0, "rgba(0, 150, 255, 0.9)");
    timerGradient.addColorStop(1, "rgba(0, 80, 200, 0.9)");
    ctx.fillStyle = timerGradient;
    ctx.fillRect(0, 0, barWidth, barHeight);
  }

  // Function to display game messages
  function displayGameMessages() {
    ctx.textAlign = "center";
    if (showGameOverMessage) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, canvas.height / 2 - 60, canvas.width, 120);
      ctx.strokeStyle = "#ff3300";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, canvas.height / 2 - 60, canvas.width, 120);
      ctx.fillStyle = "white";
      ctx.font = "bold 28px Arial";
      ctx.fillText(
        `Game Over! Your score: ${score}`,
        canvas.width / 2,
        canvas.height / 2 - 15
      );
      ctx.font = "bold 22px Arial";
      ctx.fillText(
        "Press Enter to restart the game",
        canvas.width / 2,
        canvas.height / 2 + 25
      );
    }
  }

  // Event listeners for menu buttons
  newGameBtn.addEventListener("click", startGame);

  continueBtn.addEventListener("click", resumeGame);

  difficultyBtn.addEventListener("click", () => {
    showPanel(difficultyMenu);
  });

  highscoreBtn.addEventListener("click", () => {
    showPanel(highscoreMenu);
  });

  easyBtn.addEventListener("click", () => {
    setDifficulty("easy");
  });

  normalBtn.addEventListener("click", () => {
    setDifficulty("normal");
  });

  hardBtn.addEventListener("click", () => {
    setDifficulty("hard");
  });

  difficultyBackBtn.addEventListener("click", () => {
    showPanel(mainMenu);
  });

  resetHighscoreBtn.addEventListener("click", resetHighscore);

  highscoreBackBtn.addEventListener("click", () => {
    showPanel(mainMenu);
  });

  // Make menu overlay active by default to ensure it shows
  menuOverlay.classList.add("active");

  // Ensure initial menu display is working
  function showMenu() {
    menuOverlay.classList.add("active");
    updateDifficultySelection();
    menuHighscoreElement.textContent = highscore;

    // Show "Continue Game" button only if a game is in progress
    if (gameRunning && !showGameOverMessage) {
      continueBtn.classList.remove("hidden");
    } else {
      continueBtn.classList.add("hidden");
    }
  }

  // Draw game board initially so it's not blank
  drawGame();

  // Force food placement for the initial draw
  if (!gameInitialized) {
    placeFood();
    gameInitialized = true;
  }

  // Make absolutely sure the menu shows on startup by running at the very end of initialization
  showMenu();
});
