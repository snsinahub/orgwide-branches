# Organization-wide Branch Finder

A GitHub Action to list all repositories from an owner (user or organization) and optionally search for specific branches across all repositories.

## Features

- 📋 List all repositories for a GitHub user or organization
- 🔍 Search for specific branches across all repositories
- 📊 Generate a summary report in the GitHub Actions UI
- 🔐 Supports both public and private repositories (with appropriate token permissions)
- 🎨 Multiple output formats: JSON, flat (newline-delimited), array, and CSV
- 🔢 Repository count output for easy statistics
- 🎯 Filter repositories by visibility (public, private, internal, or all)
- 🍴 Filter repositories by fork status (include all, exclude forks, or only forks)

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

### List Repositories with Custom Output Format

List repositories in CSV format:

```yaml
name: List Repositories CSV
on:
  workflow_dispatch:

jobs:
  list-repos-csv:
    runs-on: ubuntu-latest
    steps:
      - name: List repositories in CSV format
        id: list-csv
        uses: snsinahub/orgwide-branches@v1
        with:
          owner: 'your-username-or-org'
          token: ${{ secrets.GITHUB_TOKEN }}
          output-format: 'csv'
      
      - name: Show CSV output
        run: |
          echo "Repository count: ${{ steps.list-csv.outputs.repository-count }}"
          echo "Repositories:"
          echo "${{ steps.list-csv.outputs.repositories }}"
```

### Filter Repositories

List only public, non-forked repositories:

```yaml
name: List Public Non-Forked Repos
on:
  workflow_dispatch:

jobs:
  list-public:
    runs-on: ubuntu-latest
    steps:
      - name: List public non-forked repositories
        uses: snsinahub/orgwide-branches@v1
        with:
          owner: 'your-username-or-org'
          token: ${{ secrets.GITHUB_TOKEN }}
          visibility: 'public'
          include-forks: 'false'
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
          output-format: 'json'
      
      - name: Process results
        run: |
          echo "Total repositories: ${{ steps.find-repos.outputs.repository-count }}"
          echo "Repositories with dev branch: ${{ steps.find-repos.outputs.repositories-with-branch-count }}"
          echo "All repositories:"
          echo '${{ steps.find-repos.outputs.repositories }}' | jq '.'
          
          echo "Repositories with dev branch:"
          echo '${{ steps.find-repos.outputs.repositories-with-branch }}' | jq '.'
```

### Using Different Output Formats

```yaml
jobs:
  multi-format:
    runs-on: ubuntu-latest
    steps:
      - name: Get repos as flat list
        id: flat
        uses: snsinahub/orgwide-branches@v1
        with:
          owner: 'your-username-or-org'
          token: ${{ secrets.GITHUB_TOKEN }}
          output-format: 'flat'
      
      - name: Get repos as array
        id: array
        uses: snsinahub/orgwide-branches@v1
        with:
          owner: 'your-username-or-org'
          token: ${{ secrets.GITHUB_TOKEN }}
          output-format: 'array'
      
      - name: Display outputs
        run: |
          echo "Flat format (newline-delimited):"
          echo "${{ steps.flat.outputs.repositories }}"
          
          echo "Array format:"
          echo "${{ steps.array.outputs.repositories }}"
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `owner` | GitHub owner (username or organization name) | Yes | - |
| `token` | GitHub token with repo read access | Yes | - |
| `branch-name` | Branch name to search for across all repositories | No | `''` (empty) |
| `output-format` | Output format: `json`, `flat`, `array`, or `csv` | No | `json` |
| `visibility` | Filter by repository visibility: `all`, `public`, `private`, or `internal` | No | `all` |
| `include-forks` | Include forked repositories: `true`, `false`, or `only` | No | `true` |

## Outputs

| Output | Description |
|--------|-------------|
| `repositories` | Repositories in the specified format (json, flat, array, or csv) |
| `repositories-with-branch` | Repositories with branch in the specified format (if `branch-name` is provided) |
| `repository-count` | Total count of repositories found (after applying filters) |
| `repositories-with-branch-count` | Count of repositories containing the specified branch (if `branch-name` is provided) |

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

### Example 4: Export repository list as CSV

```yaml
name: Export Repositories to CSV
on:
  workflow_dispatch:

jobs:
  export-csv:
    runs-on: ubuntu-latest
    steps:
      - name: Get repositories as CSV
        id: csv-export
        uses: snsinahub/orgwide-branches@v1
        with:
          owner: 'my-organization'
          token: ${{ secrets.GITHUB_TOKEN }}
          output-format: 'csv'
          visibility: 'all'
      
      - name: Save CSV to file
        run: |
          echo "${{ steps.csv-export.outputs.repositories }}" > repositories.csv
          cat repositories.csv
      
      - name: Upload CSV artifact
        uses: actions/upload-artifact@v4
        with:
          name: repositories-csv
          path: repositories.csv
```

### Example 5: Count repositories by type

```yaml
name: Repository Statistics
on:
  workflow_dispatch:

jobs:
  repo-stats:
    runs-on: ubuntu-latest
    steps:
      - name: Count all repositories
        id: all
        uses: snsinahub/orgwide-branches@v1
        with:
          owner: 'my-organization'
          token: ${{ secrets.GITHUB_TOKEN }}
          output-format: 'json'
      
      - name: Count public repositories
        id: public
        uses: snsinahub/orgwide-branches@v1
        with:
          owner: 'my-organization'
          token: ${{ secrets.GITHUB_TOKEN }}
          visibility: 'public'
          output-format: 'json'
      
      - name: Count private repositories
        id: private
        uses: snsinahub/orgwide-branches@v1
        with:
          owner: 'my-organization'
          token: ${{ secrets.GITHUB_TOKEN }}
          visibility: 'private'
          output-format: 'json'
      
      - name: Count forked repositories
        id: forks
        uses: snsinahub/orgwide-branches@v1
        with:
          owner: 'my-organization'
          token: ${{ secrets.GITHUB_TOKEN }}
          include-forks: 'only'
          output-format: 'json'
      
      - name: Display statistics
        run: |
          echo "Total repositories: ${{ steps.all.outputs.repository-count }}"
          echo "Public repositories: ${{ steps.public.outputs.repository-count }}"
          echo "Private repositories: ${{ steps.private.outputs.repository-count }}"
          echo "Forked repositories: ${{ steps.forks.outputs.repository-count }}"
```

### Example 6: List only non-forked public repositories

```yaml
name: List Non-Forked Public Repos
on:
  workflow_dispatch:

jobs:
  list-original:
    runs-on: ubuntu-latest
    steps:
      - name: Get non-forked public repos
        id: originals
        uses: snsinahub/orgwide-branches@v1
        with:
          owner: 'my-organization'
          token: ${{ secrets.GITHUB_TOKEN }}
          visibility: 'public'
          include-forks: 'false'
          output-format: 'flat'
      
      - name: Display results
        run: |
          echo "Found ${{ steps.originals.outputs.repository-count }} non-forked public repositories:"
          echo "${{ steps.originals.outputs.repositories }}"
```

## Output Format

The action supports multiple output formats to suit different use cases:

### JSON Format (default)

Returns an array of objects with `name` and `full_name`:

```json
[
  {
    "name": "repo-name",
    "full_name": "owner/repo-name"
  }
]
```

### Flat Format

Returns repository full names separated by newlines:

```
owner/repo-name-1
owner/repo-name-2
owner/repo-name-3
```

### Array Format

Returns a JSON array of repository full names:

```json
["owner/repo-name-1", "owner/repo-name-2", "owner/repo-name-3"]
```

### CSV Format

Returns comma-separated values with a header row:

```csv
name,full_name
repo-name-1,owner/repo-name-1
repo-name-2,owner/repo-name-2
repo-name-3,owner/repo-name-3
```

## Filter Options

### Visibility Filter

- `all` (default): Include all repositories regardless of visibility
- `public`: Only public repositories
- `private`: Only private repositories
- `internal`: Only internal repositories (organization only)

### Fork Filter

- `true` (default): Include all repositories, including forks
- `false`: Exclude forked repositories
- `only`: Only include forked repositories

## Legacy Output Format

For backward compatibility, the action still outputs repository details in the job summary. When using JSON format with no branch filter, the summary includes URL and default branch information.

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