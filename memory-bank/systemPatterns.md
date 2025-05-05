# System Patterns

## Architecture Overview
- Static web application (no backend)
- Client-side only implementation
- Local storage for user data
- AR.js and A-Frame for augmented reality functionality
- Location-based AR with virtual coordinates
- Finite State Machine for game state management
- Event-driven component system for interactions

## Key Components
1. **AR Scene Management**
   - Scene initialization and camera access
   - Virtual coordinate system for location-based AR
   - 3D object creation and placement
   - User interaction with AR elements
   - Position stabilization algorithms

2. **Game State Management**
   - Finite State Machine (FSM) implementation
   - State transitions and handlers
   - Event system for state communication
   - Game data storage and management

3. **Quiz System**
   - Question management
   - Level generation algorithms
   - Answer validation
   - Score calculation
   - Feedback mechanisms
   - Progress tracking

4. **User Interface**
   - HTML/CSS overlay for UI elements
   - 3D interaction feedback components
   - Navigation between screens
   - Subject and level selection
   - User input handling
   - Results display and visualization

5. **Data Management**
   - Local storage for user progress
   - Quiz questions and answers database
   - Leaderboard data management
   - Persistence across sessions
   - Browser compatibility handling

## Design Patterns
- **Finite State Machine (FSM)**: For managing game states and transitions
- **Observer Pattern**: For event-driven communication between components
- **Factory Pattern**: For creating game objects and UI elements
- **Component-based architecture**: Using A-Frame component system
- **Facade Pattern**: To simplify complex subsystem interactions
- **Strategy Pattern**: For different quiz question types and difficulty levels
- **Responsive design**: For adapting to different device sizes and capabilities
