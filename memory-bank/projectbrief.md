# Project Brief: AR-Квиз

## Overview
AR-Квиз is an educational augmented reality application designed for school education. The project is implemented using AR.js and A-Frame, allowing creation of interactive AR content using simple HTML tags without requiring additional software installation.

## Key Features
- Browser-based mobile application
- Markerless augmented reality
- Subject selection (Geology, Botany, Anatomy)
- 10 difficulty levels per subject
- Score system and leaderboard
- Interactive 3D object interaction

## Technical Specifications
- **Technologies**: AR.js 3.4.7, A-Frame
- **AR Type**: Markerless augmented reality
- **Interface Language**: Russian
- **Interface Elements**: SVG icons
- **Data Storage**: Local (no server-side)
- **Requirements**: Mobile device with camera and WebXR/AR.js support

## Project Structure
- **index.html** - main application file
- **styles.css** - interface styles
- **app.js** - core application logic
- **quiz-data.js** - question and answer data
- **assets/** - resources directory (SVG icons, sounds, etc.)

## Implementation Details
- Demo version uses primitive 3D objects (spheres, cubes, etc.)
- The correct answer is always a sphere (of different colors)
- Leaderboard contains demo data with 5 users
- Semi-transparent interface allowing view of the real world through the camera
- Objects are fixed in space, allowing users to walk around and view them from different angles
