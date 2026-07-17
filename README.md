# Dirt Bike Racing 3D

A world-class dirt bike racing game built with TypeScript and Three.js, hosted on GitHub Pages.

## Features

- **Realistic Physics**: Spring-damper suspension, terrain adaptation, air control
- **Procedural Terrain**: FBM noise heightmap with track carving
- **Dynamic Camera**: Chase cam with speed-based FOV
- **Particle Effects**: Object-pooled dust trails and landing impacts
- **AI Opponents**: Circle-following bots with lap tracking
- **Mobile Support**: Touch controls for mobile devices
- **Career Mode**: localStorage persistence with versioning

## Tech Stack

- **Three.js r160**: 3D rendering via ES modules
- **TypeScript**: Type safety and better IDE support
- **Vite**: Fast bundling and development server
- **Vitest**: Browser testing with Playwright
- **GitHub Pages**: Deployment platform

## Getting Started

### Prerequisites

- Node.js 22+
- npm 9+

### Installation

```bash
# Install dependencies
npm ci

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Development

1. Start development server: `npm run dev`
2. Open browser to http://localhost:5173
3. Edit TypeScript files in `src/`
4. Run tests: `npm test`
5. Build for deployment: `npm run build`

### Deployment

The project automatically deploys to GitHub Pages when changes are pushed to the `main` branch.

1. Push changes to `main` branch
2. GitHub Actions runs tests
3. If tests pass, builds and deploys to GitHub Pages
4. Visit https://dominick253.github.io/dirt-bike-racing/

## Project Structure

```
dirt-bike-racing/
  index.html                  # Entry point HTML
  package.json               # Dependencies and scripts
  vite.config.ts             # Vite configuration
  vitest.config.ts           # Vitest configuration
  tsconfig.json              # TypeScript configuration
  .github/
    workflows/
      test-and-deploy.yml    # CI/CD pipeline
  .htaccess                  # MIME type headers
  tests/
    core.test.ts             # Unit tests
    setup.ts                 # Test setup
  src/                       # TypeScript source code
    main.ts                  # Main game controller
    core/
      input.ts               # Input handling
    physics/
      bike.ts                # Bike physics
    world/
      terrain.ts             # Terrain generation
      particles.ts           # Particle system
    render/
      camera.ts              # Camera system
    utils/
      noise.ts               # Simplex noise
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

- Noise generation consistency
- Bike physics updates
- Terrain height sampling
- Track mesh creation

## Performance

- **Load time**: < 3 seconds on 4G
- **FPS**: 60fps on mid-range devices
- **Memory**: < 200MB RSS
- **Bundle size**: < 150KB gzipped
- **GC pressure**: Zero allocations during gameplay

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and write tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Three.js team for the amazing 3D library
- Vite team for the fast build tool
- GitHub for hosting and CI/CD
