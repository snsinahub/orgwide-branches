# Contributing to Organization-wide Branch Finder

Thank you for considering contributing to this project! Here are some guidelines to help you get started.

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/orgwide-branches.git
   cd orgwide-branches
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Making Changes

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. Make your changes in the `src/index.js` file

3. Build the action:
   ```bash
   npm run build
   ```

4. Test your changes using the example workflow

5. Commit your changes:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

6. Push to your fork and create a Pull Request

## Code Style

- Use clear, descriptive variable names
- Add comments for complex logic
- Follow existing code patterns
- Use async/await for asynchronous operations

## Testing

Before submitting a PR:
- Build the action with `npm run build`
- Test the action using the example workflow
- Ensure there are no npm vulnerabilities (`npm audit`)

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the version numbers following [Semantic Versioning](https://semver.org/)
3. The PR will be merged once it has been reviewed and approved

## Code of Conduct

Be respectful and constructive in all interactions.
