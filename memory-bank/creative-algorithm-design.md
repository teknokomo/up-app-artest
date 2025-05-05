# 🎨🎨🎨 ENTERING CREATIVE PHASE: ALGORITHM DESIGN

## Component Description
We need to develop an algorithm for generating and managing the AR-quiz gameplay, including level creation, answer evaluation, score calculation, and tracking user progress.

## Requirements & Constraints
- 3 subjects with 10 levels each
- 3 objects at each level (1 correct, 2 incorrect)
- The correct answer is always represented by a sphere of different colors
- 2 points for a correct answer on the first attempt
- 1 point for a correct answer on the second attempt
- 0 points and a hint after two unsuccessful attempts
- Demo data for the leaderboard (5 players)
- Saving the user's name and position in the ranking
- Optimization for mobile device performance

## Multiple Algorithm Options

### Option 1: Sequential Structure with Preloading
- **Approach**: Loading all data and level logic at the beginning
- **Features**:
  - Preloading all questions and object configurations
  - Sequential progression through levels
  - Storing game state in a state object
  - Modular functions for each aspect of gameplay

### Option 2: Event-Driven Architecture
- **Approach**: Event-based system for managing gameplay
- **Features**:
  - Definition of custom events for game actions
  - Event listeners for processing game logic
  - Asynchronous interaction processing
  - Component structure for code modularity

### Option 3: Finite State Machine (FSM)
- **Approach**: Modeling the gameplay as a finite state machine
- **Features**:
  - Definition of specific game states (menu, selection, game, results)
  - Clear transitions between states
  - Encapsulation of state logic
  - Predictable behavior and control

### Option 4: Adaptive System with Caching
- **Approach**: Dynamic loading and caching based on performance
- **Features**:
  - Dynamic level generation as the user progresses
  - Adaptive difficulty based on player success
  - Resource caching for performance optimization
  - Progressive content loading

## Options Analysis

### Option 1: Sequential Structure with Preloading
**Advantages**:
- Simplicity of implementation and maintenance
- Predictable execution flow
- Low overhead for state management
- Ease of debugging

**Disadvantages**:
- Possible delay during initial loading
- Less flexible structure for complex interactions
- Difficulties when adding new features
- Limited possibilities for asynchronous operations

### Option 2: Event-Driven Architecture
**Advantages**:
- High modularity and loose coupling of components
- Flexibility when expanding functionality
- Efficient handling of asynchronous interactions
- Good scalability

**Disadvantages**:
- Complexity in tracking execution flow
- Potential performance issues with a large number of events
- More difficult to debug and test
- Risk of memory leaks with improper handling of event handlers

### Option 3: Finite State Machine (FSM)
**Advantages**:
- Clear structure and predictable behavior
- Ease of debugging and testing
- Natural representation of the gameplay process
- Effective management of complex transitions between states

**Disadvantages**:
- Higher initial implementation complexity
- Potential proliferation of states
- Difficulty when adding parallel processes
- Requires a more structured approach to design

### Option 4: Adaptive System with Caching
**Advantages**:
- Optimal use of device resources
- Better performance on low-end devices
- Dynamic adaptation to user capabilities
- Fast initial loading

**Disadvantages**:
- Most complex implementation of all options
- Difficulty in ensuring consistent experience
- Need for thorough testing on different devices
- Potential issues with caching and memory management

## Recommended Approach

**Choice: Finite State Machine (FSM) with elements of Event-Driven Architecture (Option 3 + elements of Option 2)**

It is recommended to use the finite state machine approach for the main gameplay structure, supplemented with event-driven mechanisms for handling user interactions and feedback.

### Rationale:
1. **Structure**: FSM provides a clear and predictable structure for the gameplay process
2. **Flexibility**: The event-based approach allows for flexible handling of user interactions
3. **Performance**: The combined approach optimizes resource usage
4. **Scalability**: Easy addition of new states and event handlers
5. **Debugging**: Clear separation into states simplifies finding and fixing bugs

## Implementation Guidelines

1. **Game State Definition**:
   ```javascript
   const GameState = {
     INTRO: 'intro',
     USER_INPUT: 'user_input',
     SUBJECT_SELECT: 'subject_select',
     LEVEL_INTRO: 'level_intro',
     LEVEL_ACTIVE: 'level_active',
     LEVEL_FEEDBACK: 'level_feedback',
     RESULTS: 'results'
   };
   ```

2. **Main State Manager**:
   ```javascript
   class GameStateManager {
     constructor() {
       this.currentState = GameState.INTRO;
       this.prevState = null;
       this.gameData = {
         userName: '',
         subject: '',
         level: 1,
         score: 0,
         attempts: 0,
         levelObjects: []
       };
       this.stateHandlers = {
         [GameState.INTRO]: this.handleIntroState.bind(this),
         [GameState.USER_INPUT]: this.handleUserInputState.bind(this),
         [GameState.SUBJECT_SELECT]: this.handleSubjectSelectState.bind(this),
         [GameState.LEVEL_INTRO]: this.handleLevelIntroState.bind(this),
         [GameState.LEVEL_ACTIVE]: this.handleLevelActiveState.bind(this),
         [GameState.LEVEL_FEEDBACK]: this.handleLevelFeedbackState.bind(this),
         [GameState.RESULTS]: this.handleResultsState.bind(this)
       };
       this.events = new EventEmitter();
     }
     
     setState(newState, stateData = {}) {
       this.prevState = this.currentState;
       this.currentState = newState;
       
       // Call handler for the new state
       if (this.stateHandlers[newState]) {
         this.stateHandlers[newState](stateData);
       }
       
       // Notify about state change
       this.events.emit('stateChanged', { from: this.prevState, to: newState, data: stateData });
     }
     
     // Implementation of state handlers...
   }
   ```

3. **Event System for Handling Interactions**:
   ```javascript
   class EventEmitter {
     constructor() {
       this.listeners = {};
     }
     
     on(event, callback) {
       if (!this.listeners[event]) {
         this.listeners[event] = [];
       }
       this.listeners[event].push(callback);
       return () => this.off(event, callback); // Return function to remove listener
     }
     
     off(event, callback) {
       if (this.listeners[event]) {
         this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
       }
     }
     
     emit(event, data) {
       if (this.listeners[event]) {
         this.listeners[event].forEach(callback => {
           setTimeout(() => callback(data), 0); // Asynchronous dispatch to prevent blocking
         });
       }
     }
     
     once(event, callback) {
       const onceCallback = (data) => {
         callback(data);
         this.off(event, onceCallback);
       };
       this.on(event, onceCallback);
     }
   }
   ```

4. **Level and Object Generation**:
   ```javascript
   function generateLevelObjects(level, subject) {
     // Determine the question for the current level
     const question = getQuestionForLevel(level, subject);
     
     // Define 3 objects (1 correct, 2 incorrect)
     const wrongShapes = ['box', 'cylinder', 'cone', 'torus'];
     const brightColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#FFFF33', '#33FFFF'];
     
     // Determine colors
     const colors = getRandomUniqueItems(brightColors, 3);
     
     // Determine incorrect shapes
     const wrongShapeTypes = getRandomUniqueItems(wrongShapes, 2);
     
     // Create objects
     const objects = [
       // Correct answer (always a sphere)
       {
         type: 'sphere',
         color: colors[0],
         radius: 0.7,
         correct: true
       },
       // Incorrect answers
       {
         type: wrongShapeTypes[0],
         color: colors[1],
         size: 1.0,
         correct: false
       },
       {
         type: wrongShapeTypes[1],
         color: colors[2],
         size: 1.0,
         correct: false
       }
     ];
     
     // Shuffle object order
     return shuffleArray(objects);
   }
   ```

5. **Answer Processing and Score Calculation**:
   ```javascript
   function handleAnswer(isCorrect, attempts) {
     if (isCorrect) {
       // Determine points based on number of attempts
       let points = 0;
       if (attempts === 0) {
         points = 2;
         showFeedback("Correct! +2 points");
       } else if (attempts === 1) {
         points = 1;
         showFeedback("Correct! +1 point");
       } else {
         showFeedback("Correct!");
       }
       
       // Update score and move to next level
       return {
         success: true,
         points,
         nextAction: 'nextLevel'
       };
     } else {
       // Incorrect answer
       if (attempts === 0) {
         // First attempt failed
         showFeedback("Incorrect! Try again.");
         return {
           success: false,
           points: 0,
           nextAction: 'retry'
         };
       } else {
         // Second attempt failed
         showFeedback("Hint! Look for the sphere.");
         return {
           success: false,
           points: 0,
           nextAction: 'showHint'
         };
       }
     }
   }
   ```

# 🎨🎨🎨 CONTINUING CREATIVE PHASE: ALGORITHM DESIGN

6. **Leaderboard Management**:
   ```javascript
   class LeaderboardManager {
     constructor() {
       // Demo data for the leaderboard
       this.demoPlayers = [
         {name: 'Alex', score: 19},
         {name: 'Maria', score: 17},
         {name: 'Dmitry', score: 15},
         {name: 'Olga', score: 13},
         {name: 'Ivan', score: 11}
       ];
       
       // Try to restore saved data
       try {
         const savedData = localStorage.getItem('arQuizLeaderboard');
         if (savedData) {
           this.demoPlayers = JSON.parse(savedData);
         }
       } catch (e) {
         console.error('Error loading leaderboard data:', e);
       }
     }
     
     // Add new result
     addScore(playerName, score) {
       // Check if player already exists
       const existingPlayerIndex = this.demoPlayers.findIndex(p => p.name === playerName);
       
       if (existingPlayerIndex !== -1) {
         // Update only if new result is better
         if (score > this.demoPlayers[existingPlayerIndex].score) {
           this.demoPlayers[existingPlayerIndex].score = score;
         }
       } else {
         // Add new player
         this.demoPlayers.push({name: playerName, score});
       }
       
       // Sort by descending score
       this.demoPlayers.sort((a, b) => b.score - a.score);
       
       // Save updated data
       this.saveLeaderboard();
       
       return this.getPlayerRank(playerName);
     }
     
     // Get player rank
     getPlayerRank(playerName) {
       const index = this.demoPlayers.findIndex(p => p.name === playerName);
       return index !== -1 ? index + 1 : null;
     }
     
     // Get leaderboard data
     getLeaderboard() {
       return [...this.demoPlayers];
     }
     
     // Save data to localStorage
     saveLeaderboard() {
       try {
         localStorage.setItem('arQuizLeaderboard', JSON.stringify(this.demoPlayers));
       } catch (e) {
         console.error('Error saving leaderboard data:', e);
       }
     }
   }
   ```

7. **Data and Progress Management System**:
   ```javascript
   class ProgressManager {
     constructor() {
       this.reset();
       
       // Try to restore progress
       try {
         const savedProgress = localStorage.getItem('arQuizProgress');
         if (savedProgress) {
           const data = JSON.parse(savedProgress);
           this.userName = data.userName || '';
           this.lastSubject = data.lastSubject || '';
         }
       } catch (e) {
         console.error('Error loading progress data:', e);
       }
     }
     
     // Reset current game progress
     reset() {
       this.level = 1;
       this.score = 0;
       this.attempts = 0;
       this.subject = '';
       this.isGameActive = false;
     }
     
     // Start new game
     startGame(userName, subject) {
       this.reset();
       this.userName = userName;
       this.subject = subject;
       this.lastSubject = subject;
       this.isGameActive = true;
       
       this.saveProgress();
       
       return {
         userName: this.userName,
         subject: this.subject,
         level: this.level,
         score: this.score
       };
     }
     
     // Process answer
     processAnswer(isCorrect) {
       if (isCorrect) {
         // Award points based on attempts
         if (this.attempts === 0) {
           this.score += 2;
         } else if (this.attempts === 1) {
           this.score += 1;
         }
         
         // Move to next level
         this.level++;
         this.attempts = 0;
         
         // Check if game is over
         if (this.level > 10) {
           this.isGameActive = false;
           return {
             gameOver: true,
             finalScore: this.score
           };
         }
       } else {
         // Increase attempt counter
         this.attempts++;
       }
       
       this.saveProgress();
       
       return {
         gameOver: false,
         level: this.level,
         score: this.score,
         attempts: this.attempts
       };
     }
     
     // Save progress
     saveProgress() {
       try {
         localStorage.setItem('arQuizProgress', JSON.stringify({
           userName: this.userName,
           lastSubject: this.lastSubject
         }));
       } catch (e) {
         console.error('Error saving progress data:', e);
       }
     }
     
     // Get current state
     getState() {
       return {
         userName: this.userName,
         subject: this.subject,
         level: this.level,
         score: this.score,
         attempts: this.attempts,
         isGameActive: this.isGameActive
       };
     }
   }
   ```

8. **Integration with Main Game Flow**:
   ```javascript
   class QuizGame {
     constructor() {
       this.stateManager = new GameStateManager();
       this.progressManager = new ProgressManager();
       this.leaderboardManager = new LeaderboardManager();
       
       // Game data
       this.questions = {
         "Geology": [ /* question array */ ],
         "Botany": [ /* question array */ ],
         "Anatomy": [ /* question array */ ]
       };
       
       // Setup UI event listeners
       this.setupEventListeners();
       
       // Initial state
       this.stateManager.setState(GameState.INTRO);
     }
     
     setupEventListeners() {
       // Handle "Start" button click
       document.getElementById('startButton').addEventListener('click', () => {
         this.stateManager.setState(GameState.USER_INPUT);
       });
       
       // Handle name input form and subject selection
       document.getElementById('beginQuizButton').addEventListener('click', () => {
         const nameInput = document.getElementById('userName').value.trim();
         const subj = document.getElementById('subjectSelect').value;
         
         if (nameInput === "" || subj === "") {
           alert("Please enter your name and select a subject.");
           return;
         }
         
         // Start game with provided data
         const gameState = this.progressManager.startGame(nameInput, subj);
         this.stateManager.setState(GameState.LEVEL_INTRO, gameState);
       });
       
       // Handle click on object in AR scene
       this.stateManager.events.on('objectSelected', (objectData) => {
         if (this.stateManager.currentState === GameState.LEVEL_ACTIVE) {
           const isCorrect = objectData.correct;
           const result = this.progressManager.processAnswer(isCorrect);
           
           if (result.gameOver) {
             // Game over, show results
             const rank = this.leaderboardManager.addScore(
               this.progressManager.userName, 
               result.finalScore
             );
             
             this.stateManager.setState(GameState.RESULTS, {
               playerName: this.progressManager.userName,
               score: result.finalScore,
               rank: rank,
               leaderboard: this.leaderboardManager.getLeaderboard()
             });
           } else if (isCorrect) {
             // Correct answer, show feedback and move to next level
             this.stateManager.setState(GameState.LEVEL_FEEDBACK, {
               correct: true,
               score: result.score,
               nextLevel: result.level
             });
           } else {
             // Incorrect answer
             if (result.attempts === 1) {
               // First unsuccessful attempt
               showFeedback("Incorrect! Try again.");
             } else {
               // Second unsuccessful attempt, show hint
               showFeedback("Hint! Look for the sphere.");
               this.stateManager.setState(GameState.LEVEL_FEEDBACK, {
                 correct: false,
                 showHint: true
               });
             }
           }
         }
       });
       
       // Other handlers for navigation buttons...
     }
     
     // Methods for managing gameplay
     startNewGame() {
       this.progressManager.reset();
       this.stateManager.setState(GameState.USER_INPUT);
     }
     
     restartGame() {
       const userName = this.progressManager.userName;
       const subject = this.progressManager.subject;
       this.progressManager.startGame(userName, subject);
       this.stateManager.setState(GameState.LEVEL_INTRO);
     }
     
     changeSubject() {
       this.progressManager.reset();
       this.stateManager.setState(GameState.USER_INPUT);
     }
     
     // Other methods for game management...
   }
   ```

9. **Utilities for Working with Objects and Random Values**:
   ```javascript
   // Shuffle array
   function shuffleArray(array) {
     const arr = [...array];
     for (let i = arr.length - 1; i > 0; i--) {
       const j = Math.floor(Math.random() * (i + 1));
       [arr[i], arr[j]] = [arr[j], arr[i]];
     }
     return arr;
   }
   
   // Get random unique items from array
   function getRandomUniqueItems(array, count) {
     const shuffled = shuffleArray(array);
     return shuffled.slice(0, count);
   }
   
   // Calculate distance between points
   function calculateDistance(point1, point2) {
     return Math.sqrt(
       Math.pow(point2.x - point1.x, 2) +
       Math.pow(point2.y - point1.y, 2) +
       Math.pow(point2.z - point1.z, 2)
     );
   }
   
   // Convert meters to GPS coordinates
   function metersToGPS(origin, x, z) {
     // Constants for converting meters to degrees
     // (approximately for middle latitudes)
     const LAT_METER = 0.000009;  // approximately 111,111 meters/degree
     const LON_METER = 0.000011;  // approximately 90,000 meters/degree
     
     return {
       latitude: origin.latitude + (z * LAT_METER),
       longitude: origin.longitude + (x * LON_METER)
     };
   }
   ```

## Verification
The proposed algorithmic approach meets the requirements:
- Provides structure for 3 subjects with 10 levels
- Generates 3 objects per level (1 correct, 2 incorrect)
- Correct answer is always represented by a sphere of different colors
- Implements point system (2/1/0) depending on attempts
- Includes hint after two unsuccessful attempts
- Supports leaderboard with demo data
- Saves user progress
- Optimized for performance on mobile devices
- Uses finite state machine architecture for clear state management
- Provides modularity and extensibility

# 🎨🎨🎨 EXITING CREATIVE PHASE
