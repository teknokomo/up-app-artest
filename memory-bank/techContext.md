# Technical Context

## Core Technologies
- HTML5 + CSS3 for structural and presentational markup
- JavaScript (ES6+) for application logic
- A-Frame (v1.3.0) as WebXR framework
- AR.js for augmented reality capabilities
- LocalStorage API for data persistence

## Architecture Approach
- Component-based architecture
- Separation of concerns between AR, state management, and UI
- Event-driven communication between components
- Finite State Machine (FSM) for application state management
- Non-blocking asynchronous operations

## AR Implementation
- Dual AR mode support:
  - Marker-based AR using Hiro marker
  - Location-based (markerless) AR with virtual coordinate system
- Optimized renderer settings with precision mediump and logarithmicDepthBuffer
- Ambient light for proper rendering on mobile devices
- Improved camera FOV (40°) and raycasting for better object interaction
- Proper DOM hierarchy for marker-based object stability
- Configurable smoothCount for improved marker tracking
- Object shuffling for variety in quiz presentations
- Proper object cleanup between questions to prevent duplication

## Performance Considerations
- Mobile-first design approach
- Optimized asset loading
- Efficient rendering with shader optimizations
- Throttled operations for better performance
- Memory management for long-running sessions

## Browser Compatibility
- Target: Modern mobile browsers with WebXR support
- Fallback: 2D experience for unsupported browsers
- Required: WebGL, WebRTC, DeviceOrientation API

## Development Methodology
- Feature-first development
- Iterative and incremental improvement
- Performance-driven optimization
- User-centered design principles

## Browser Technologies
- WebXR and WebGL for 3D rendering
- Camera access through getUserMedia API
- Responsive design with CSS media queries

## Development Approach
- Vanilla JavaScript without build tools
- HTML/CSS for UI elements
- SVG for icons and visual elements
- Direct DOM manipulation for UI updates

## Mobile Optimization
- Lightweight 3D models (primitives)
- Texture optimization
- Performance monitoring
- Battery and resource usage considerations

## Technical Constraints
- Browser compatibility (Chrome recommended)
- Device capability requirements
- Limited to devices with camera and accelerometer
- Internet connection required for initial load
- HTTPS requirement for camera access
- Location-based AR with virtual coordinates for markerless implementation
