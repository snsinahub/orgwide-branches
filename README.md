# Organization-wide Branch Finder

A GitHub Action to list all repositories from an owner (user or organization) and optionally search for specific branches across all repositories.

## Features

- 📋 List all repositories for a GitHub user or organization
- 🔍 Search for specific branches across all repositories
- 📊 Generate a summary report in the GitHub Actions UI
- 🔐 Supports both public and private repositories (with appropriate token permissions)

## Usage

### List All Repositories

To list all repositories for an owner:

```yaml
name: List Repositories
on:
  workflow_dispatch:

jobs:
  list-repos:
    runs-on: ubuntu-latest
    steps:
      - name: List all repositories
        uses: snsinahub/orgwide-branches@v1
        with:
          owner: 'your-username-or-org'
          token: ${{ secrets.GITHUB_TOKEN }}
```

### Search for a Specific Branch

To find all repositories that have a specific branch (e.g., `dev`):

```yaml
name: Find Branch
on:
  workflow_dispatch:
    inputs:
      branch_name:
        description: 'Branch name to search for'
        required: true
        default: 'dev'

jobs:
  find-branch:
    runs-on: ubuntu-latest
    steps:
      - name: Find repositories with branch
        uses: snsinahub/orgwide-branches@v1
        with:
          owner: 'your-username-or-org'
          token: ${{ secrets.GITHUB_TOKEN }}
          branch-name: ${{ github.event.inputs.branch_name }}
```

### Using Outputs

The action provides outputs that can be used in subsequent steps:

```yaml
jobs:
  find-and-process:
    runs-on: ubuntu-latest
    steps:
      - name: Find repositories with dev branch
        id: find-repos
        uses: snsinahub/orgwide-branches@v1
        with:
          owner: 'your-username-or-org'
          token: ${{ secrets.GITHUB_TOKEN }}
          branch-name: 'dev'
      
      - name: Process results
        run: |
          echo "All repositories:"
          echo '${{ steps.find-repos.outputs.repositories }}' | jq '.'
          
          echo "Repositories with dev branch:"
          echo '${{ steps.find-repos.outputs.repositories-with-branch }}' | jq '.'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `owner` | GitHub owner (username or organization name) | Yes | - |
| `token` | GitHub token with repo read access | Yes | - |
| `branch-name` | Branch name to search for across all repositories | No | `''` (empty) |

## Outputs

| Output | Description |
|--------|-------------|
| `repositories` | JSON array of all repositories found |
| `repositories-with-branch` | JSON array of repositories containing the specified branch (only if `branch-name` is provided) |

## Token Permissions

For public repositories, the default `GITHUB_TOKEN` is sufficient. For private repositories, you need a token with `repo` scope.

### Using GitHub Token

```yaml
with:
  token: ${{ secrets.GITHUB_TOKEN }}
```

### Using Personal Access Token

For cross-organization access or enhanced permissions:

1. Create a Personal Access Token with `repo` scope
2. Add it as a secret in your repository (e.g., `PAT_TOKEN`)
3. Use it in the action:

```yaml
with:
  token: ${{ secrets.PAT_TOKEN }}
```

## Examples

### Example 1: Weekly report of all repositories

```yaml
name: Weekly Repository Report
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM
  workflow_dispatch:

jobs:
  repository-report:
    runs-on: ubuntu-latest
    steps:
      - name: Generate repository list
        uses: snsinahub/orgwide-branches@v1
        with:
          owner: 'my-organization'
          token: ${{ secrets.GITHUB_TOKEN }}
```

### Example 2: Check for staging branch across all repos

```yaml
name: Check Staging Branches
on:
  workflow_dispatch:

jobs:
  check-staging:
    runs-on: ubuntu-latest
    steps:
      - name: Find staging branches
        uses: snsinahub/orgwide-branches@v1
        with:
          owner: 'my-organization'
          token: ${{ secrets.GITHUB_TOKEN }}
          branch-name: 'staging'
```

### Example 3: Multiple branch checks

```yaml
name: Check Multiple Branches
on:
  workflow_dispatch:

jobs:
  check-branches:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        branch: ['dev', 'staging', 'production']
    steps:
      - name: Find ${{ matrix.branch }} branch
        uses: snsinahub/orgwide-branches@v1
        with:
          owner: 'my-organization'
          token: ${{ secrets.GITHUB_TOKEN }}
          branch-name: ${{ matrix.branch }}
```

## Output Format

### Repositories Output

```json
[
  {
    "name": "repo-name",
    "full_name": "owner/repo-name",
    "url": "https://github.com/owner/repo-name",
    "default_branch": "main",
    "private": false
  }
]
```

### Repositories with Branch Output

```json
[
  {
    "name": "repo-name",
    "full_name": "owner/repo-name",
    "url": "https://github.com/owner/repo-name",
    "branch_url": "https://github.com/owner/repo-name/tree/dev"
  }
]
```

## Development

### Building the Action

```bash
npm install
npm run build
```

The built action will be in the `dist` directory.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.