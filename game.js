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
    easy: { initialSpeed: 5, speedIncrement: 0.5, bonusFrequency: 150 },
    normal: { initialSpeed: 7, speedIncrement: 1, bonusFrequency: 180 },
    hard: { initialSpeed: 10, speedIncrement: 1.5, bonusFrequency: 220 }, // Increased from 120 to 200
  };

  let currentDifficulty = localStorage.getItem("snakeDifficulty") || "normal";
  let speed = difficulties[currentDifficulty].initialSpeed;

  // Track difficulty changes during pause
  let difficultyChanged = false;
  let previousDifficulty = currentDifficulty;

  // Game state
  let gameRunning = false;
  let isPaused = false;
  let gameInitialized = false;
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

  // Sound effects (optional paths—make sure they exist or remove them)
  const milestoneSound = new Audio("/sound/milestone.wav");
  const highscoreSound = new Audio("/sound/highscore.wav");
  const gameOverSound = new Audio("/sound/game-over.wav");
  const eatSound = new Audio("/sound/eat.wav");
  const bonusFoodSound = new Audio("/sound/bonus-food.wav");

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
  let bonusFoodMinSize = 10; // Minimum size
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
  let vibrationAmount = 0;
  let gameOverAnimationFrame = 0;
  const MAX_GAME_OVER_FRAMES = 50; // Longer animation for visibility
  let gameOverAnimationId; // Dedicated animation frame ID for game over

  // ==============================
  // MENU & OVERLAY FUNCTIONS
  // ==============================

  // Show the correct panel
  function showPanel(panel) {
    mainMenu.classList.remove("active");
    difficultyMenu.classList.remove("active");
    highscoreMenu.classList.remove("active");
    panel.classList.add("active");
  }

  // Single showMenu function
  function showMenu() {
    menuOverlay.classList.add("active");
    updateDifficultySelection();
    menuHighscoreElement.textContent = highscore;

    // Show "Continue" only if a game is running & not game-over
    if (gameRunning && !showGameOverMessage) {
      continueBtn.classList.remove("hidden");
    } else {
      continueBtn.classList.add("hidden");
    }

    // Default to the main menu panel
    showPanel(mainMenu);
  }

  function hideMenu() {
    menuOverlay.classList.remove("active");
  }

  // Update difficulty selection styling
  function updateDifficultySelection() {
    easyBtn.classList.remove("selected");
    normalBtn.classList.remove("selected");
    hardBtn.classList.remove("selected");

    if (currentDifficulty === "easy") {
      easyBtn.classList.add("selected");
    } else if (currentDifficulty === "normal") {
      normalBtn.classList.add("selected");
    } else if (currentDifficulty === "hard") {
      hardBtn.classList.add("selected");
    }
  }

  // Fixed to update difficulty mid-game
  function setDifficulty(difficulty) {
    // Track if difficulty changed during gameplay
    if (currentDifficulty !== difficulty && gameRunning) {
      difficultyChanged = true;
      previousDifficulty = currentDifficulty;
    }

    currentDifficulty = difficulty;
    localStorage.setItem("snakeDifficulty", difficulty);
    bonusSpawnInterval = difficulties[difficulty].bonusFrequency;
    updateDifficultySelection();
    showPanel(mainMenu);
  }

  // Reset highscore
  function resetHighscore() {
    if (confirm("Are you sure you want to reset the highscore?")) {
      highscore = 0;
      localStorage.removeItem("snakeHighscore");
      highscoreElement.textContent = "0";
      menuHighscoreElement.textContent = "0";
    }
  }

  // ============================
  // GAME FLOW: START/PAUSE/RESUME/OVER
  // ============================

  function startGame() {
    // Make sure food is placed at least once
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

    // Clear any existing intervals/animations
    cancelAnimationFrame(animationId);
    clearInterval(moveIntervalId);

    // Start fresh
    gameRunning = true;
    isPaused = false;
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
    moveIntervalId = setInterval(moveSnake, 1000 / speed);

    hideMenu();
  }

  function pauseGame() {
    if (!gameRunning || showGameOverMessage) return;
    isPaused = true;
    clearInterval(moveIntervalId);
    cancelAnimationFrame(animationId);
    showMenu();
  }

  // Improved resume game function that respects difficulty changes
  function resumeGame() {
    if (!gameRunning || showGameOverMessage) return;

    // Apply difficulty changes if needed
    if (difficultyChanged) {
      speed = difficulties[currentDifficulty].initialSpeed;
      // If in-game score already earned, add appropriate speed increases
      if (score > 0) {
        const speedIncrements = Math.floor(score / 50);
        for (let i = 0; i < speedIncrements; i++) {
          if (speed < 15) {
            speed += difficulties[currentDifficulty].speedIncrement;
          }
        }
      }
      difficultyChanged = false;
    }

    isPaused = false;
    hideMenu();
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
    moveIntervalId = setInterval(moveSnake, 1000 / speed);
  }

  // Enhanced game over function with better animation control
  function triggerGameOver() {
    gameRunning = false;
    isPaused = false; // Ensure the game isn't paused during game over
    isGameOverAnimation = true;
    gameOverOpacity = 0;
    flashCounter = 0;
    vibrationAmount = 10;
    gameOverAnimationFrame = 0;
    showGameOverMessage = false;

    // Play sound
    try {
      gameOverSound.play().catch((e) => console.log("Sound error:", e));
    } catch (e) {
      console.log("Sound play error:", e);
    }

    // Clear any existing game loops
    clearInterval(moveIntervalId);
    cancelAnimationFrame(animationId);
    directionQueue = [];

    // Start a dedicated animation loop for game over
    gameOverAnimationId = requestAnimationFrame(handleGameOverAnimation);

    // Debug log
    console.log("Game over triggered");
  }

  // ============================
  // SNAKE & FOOD PLACEMENT
  // ============================

  function placeFood() {
    let valid = false;
    while (!valid) {
      foodX = Math.floor(Math.random() * (tileCount - 2)) + 1;
      foodY = Math.floor(Math.random() * (tileCountY - 2)) + 1;
      valid = true;

      // Make sure food doesn't appear on snake
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
    bonusFoodValue = bonusFoodMaxValue;
    bonusFoodSize = 30;
  }

  // ============================
  // GAME LOOP & MOVEMENT
  // ============================

  function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000; // in seconds
    lastTime = currentTime;

    if (!gameRunning || isPaused || isGameOverAnimation) {
      // If game over is animating, still draw so it can flash
      if (isGameOverAnimation) {
        handleGameOverAnimation();
        drawGame();
      }
      return;
    }

    // Keep looping
    animationId = requestAnimationFrame(gameLoop);

    // Draw everything
    drawGame();

    // Update any bonus food logic
    updateBonusFood(deltaTime);
  }

  function moveSnake() {
    if (!gameRunning || isPaused) return;

    // Process queued directions
    if (directionQueue.length > 0) {
      const nextDirection = directionQueue.shift();
      // Check for valid 90-degree turn (no immediate 180)
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

    // Bonus spawn logic
    bonusIntervalCounter++;
    if (bonusIntervalCounter >= bonusSpawnInterval && !isBonusFoodActive) {
      if (Math.random() < 0.15) {
        placeBonusFood();
        bonusIntervalCounter = 0;
      }
    }
  }

  function updateSnake() {
    const newHead = {
      x: snake[0].x + velocityX,
      y: snake[0].y + velocityY,
    };
    snake.unshift(newHead);

    // Check normal food
    if (newHead.x === foodX && newHead.y === foodY) {
      const previousScore = score;
      score += 10;
      scoreElement.textContent = score;

      // Sound logic
      if (score % 100 !== 0) {
        eatSound.play();
      }
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

      // Increase speed slightly every 50 points (or as you see fit)
      if (score % 50 === 0 && speed < 15) {
        speed += difficulties[currentDifficulty].speedIncrement;
        clearInterval(moveIntervalId);
        moveIntervalId = setInterval(moveSnake, 1000 / speed);
      }
    }
    // Check bonus food
    else if (
      isBonusFoodActive &&
      newHead.x === bonusFoodX &&
      newHead.y === bonusFoodY
    ) {
      const previousScore = score;
      score += bonusFoodValue;
      scoreElement.textContent = score;

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
    }
    // No food eaten, remove the tail
    else {
      snake.pop();
    }
  }

  function checkCollision() {
    // Wall collision
    if (
      snake[0].x < 0 ||
      snake[0].x >= tileCount ||
      snake[0].y < 0 ||
      snake[0].y >= tileCountY
    ) {
      triggerGameOver();
      return;
    }

    // Snake body collision
    for (let i = 1; i < snake.length; i++) {
      if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
        triggerGameOver();
        return;
      }
    }
  }

  // Completely rewritten game over animation with stronger visual effects
  function handleGameOverAnimation() {
    // Increment the animation frame counter
    gameOverAnimationFrame++;

    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply vibration effect - stronger at start, fading out
    ctx.save();
    const maxShake = 15;
    if (gameOverAnimationFrame < 30) {
      const shakeAmount = maxShake * (1 - gameOverAnimationFrame / 30);
      const dx = (Math.random() * 2 - 1) * shakeAmount;
      const dy = (Math.random() * 2 - 1) * shakeAmount;
      ctx.translate(dx, dy);
    }

    // Draw grid and snake with reduced opacity
    drawGridDots();

    // Draw snake with reduced opacity - FIX: Replace drawSnake() call with direct snake drawing code
    ctx.globalAlpha = gameOverAnimationFrame < 30 ? 0.8 : 0.4;
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

    // Flash effect - red overlay with pulsing opacity
    if (gameOverAnimationFrame < 35) {
      // More intense red flashes at the start
      if (gameOverAnimationFrame % 4 < 2) {
        const opacity = Math.min(
          0.8,
          0.4 + 0.4 * Math.sin(gameOverAnimationFrame / 2)
        );
        ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      // Fade to consistent light red
      const fadeOpacity = Math.max(
        0,
        0.3 * (1 - (gameOverAnimationFrame - 35) / 15)
      );
      ctx.fillStyle = `rgba(255, 0, 0, ${fadeOpacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.restore();

    // Continue animation or end it
    if (gameOverAnimationFrame < MAX_GAME_OVER_FRAMES) {
      gameOverAnimationId = requestAnimationFrame(handleGameOverAnimation);
    } else {
      // End animation, show game over message
      isGameOverAnimation = false;
      showGameOverMessage = true;

      // Draw final state
      drawGame();

      // Show menu with game over message
      setTimeout(() => {
        showMenu();
      }, 200);

      console.log("Game over animation complete");
    }
  }

  // ============================
  // DRAWING FUNCTIONS
  // ============================

  // Handy grid background
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

  // Draw game elements with enhanced visuals & game over effects
  function drawGame() {
    // Save the canvas state
    ctx.save();

    // Apply vibration effect during game over
    if (isGameOverAnimation && vibrationAmount > 0) {
      const dx = (Math.random() * 2 - 1) * vibrationAmount;
      const dy = (Math.random() * 2 - 1) * vibrationAmount;
      ctx.translate(dx, dy);
    }

    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGridDots();

    if (!showGameOverMessage) {
      // Show bonus timer bar if needed
      drawBonusFoodTimer();

      // Animate food radius
      foodRadius += foodRadiusDirection;
      if (foodRadius >= foodMaxRadius || foodRadius <= foodMinRadius) {
        foodRadiusDirection *= -1;
      }

      // Draw normal food
      if (typeof foodX === "number" && typeof foodY === "number") {
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

        // A little highlight
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
      }

      // Draw bonus food (if active)
      drawBonusFood();

      // Draw snake
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

      // Enhanced game over red flash with higher opacity and pulsing
      if (isGameOverAnimation) {
        const flashOn = flashCounter % 2 === 0;
        if (flashOn) {
          // Pulsing opacity based on animation progress
          const opacity = 0.3 + 0.3 * Math.sin(gameOverAnimationFrame / 3);
          ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    } else {
      // Dim the snake if game over
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

    // Show game over text if needed
    displayGameMessages();

    // Restore the canvas state
    ctx.restore();
  }

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
    roundedRect(x, y, size, size, radius);

    // Draw eyes if head
    if (isHead) {
      const eyeSize = gridSize / 5;
      const eyeOffset = gridSize / 4;

      let leftEyeX = x + eyeOffset;
      let leftEyeY = y + eyeOffset;
      let rightEyeX = x + size - eyeOffset * 1.5;
      let rightEyeY = y + eyeOffset;

      if (velocityY === -1) {
        // Up
        leftEyeX = x + eyeOffset;
        leftEyeY = y + eyeOffset;
        rightEyeX = x + size - eyeOffset * 1.5;
        rightEyeY = y + eyeOffset;
      } else if (velocityY === 1) {
        // Down
        leftEyeX = x + eyeOffset;
        leftEyeY = y + size - eyeOffset * 1.5;
        rightEyeX = x + size - eyeOffset * 1.5;
        rightEyeY = y + size - eyeOffset * 1.5;
      } else if (velocityX === -1) {
        // Left
        leftEyeX = x + eyeOffset;
        leftEyeY = y + eyeOffset;
        rightEyeX = x + eyeOffset;
        rightEyeY = y + size - eyeOffset * 1.5;
      } else {
        // Right
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
    }
  }

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

  // ============================
  // BONUS FOOD TIMER
  // ============================
  function updateBonusFood(deltaTime) {
    if (!isBonusFoodActive) return;
    bonusFoodTimer -= deltaTime;
    // Decrease the bonus value and size over time
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

    // If timer is up, remove bonus
    if (bonusFoodTimer <= 0) {
      isBonusFoodActive = false;
    }
  }

  function drawBonusFoodTimer() {
    if (!isBonusFoodActive) return;
    const timeRatio = bonusFoodTimer / bonusFoodMaxTime;
    const barWidth = canvas.width * timeRatio;
    const barHeight = 5;

    // Background bar
    ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
    ctx.fillRect(0, 0, canvas.width, barHeight);

    // Foreground gradient
    const timerGradient = ctx.createLinearGradient(0, 0, barWidth, 0);
    timerGradient.addColorStop(0, "rgba(0, 150, 255, 0.9)");
    timerGradient.addColorStop(1, "rgba(0, 80, 200, 0.9)");
    ctx.fillStyle = timerGradient;
    ctx.fillRect(0, 0, barWidth, barHeight);
  }

  // ============================
  // GAME OVER MESSAGE
  // ============================
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

  // ============================
  // KEYBOARD LISTENERS
  // ============================
  document.addEventListener("keydown", (e) => {
    // ESC for pause/resume - with browser compatibility
    if (e.key === "Escape" || e.key === "Esc") {
      // Only toggle if game is running
      if (gameRunning && !showGameOverMessage) {
        if (isPaused) {
          resumeGame();
        } else {
          pauseGame();
        }
        e.preventDefault();
        return;
      }
    }

    // Enter to restart if game over
    if (e.key === "Enter" && showGameOverMessage) {
      hideMenu();
      startGame();
      return;
    }

    // If not running or paused, ignore direction keys
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

    // Limit the queue length
    if (directionQueue.length > 3) {
      directionQueue = directionQueue.slice(-3);
    }
  });

  // ============================
  // MENU BUTTON EVENTS
  // ============================
  newGameBtn.addEventListener("click", startGame);
  continueBtn.addEventListener("click", resumeGame);
  difficultyBtn.addEventListener("click", () => showPanel(difficultyMenu));
  highscoreBtn.addEventListener("click", () => showPanel(highscoreMenu));
  easyBtn.addEventListener("click", () => setDifficulty("easy"));
  normalBtn.addEventListener("click", () => setDifficulty("normal"));
  hardBtn.addEventListener("click", () => setDifficulty("hard"));
  difficultyBackBtn.addEventListener("click", () => showPanel(mainMenu));
  resetHighscoreBtn.addEventListener("click", resetHighscore);
  highscoreBackBtn.addEventListener("click", () => showPanel(mainMenu));

  // ============================
  // INITIALIZATION
  // ============================
  // Display the menu overlay right away
  menuOverlay.classList.add("active");
  showMenu();

  // Place food so the first drawGame() won't break
  if (!gameInitialized) {
    placeFood();
    gameInitialized = true;
  }

  // Draw the board once so it's not empty
  drawGame();

  // Log any resource loading errors for debugging
  window.addEventListener(
    "error",
    function (e) {
      if (
        e.target.tagName === "IMG" ||
        e.target.tagName === "SCRIPT" ||
        e.target.tagName === "LINK" ||
        e.target instanceof HTMLAudioElement
      ) {
        console.warn("Resource error:", e.target.src || e.target.href);
      }
    },
    true
  );
});
