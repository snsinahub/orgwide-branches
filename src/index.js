const core = require('@actions/core');
const github = require('@actions/github');

// Format repositories based on the specified format
function formatRepositories(repositories, format) {
  const repoData = repositories.map(repo => ({
    name: repo.name,
    full_name: repo.full_name
  }));

  // CSV value escaping function (defined once, reused for each row)
  const escapeCsv = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(repoData);
    
    case 'flat':
      return repoData.map(repo => repo.full_name).join('\n');
    
    case 'array':
      return JSON.stringify(repoData.map(repo => repo.full_name));
    
    case 'csv':
      const csvHeader = 'name,full_name';
      const csvRows = repoData.map(repo => 
        `${escapeCsv(repo.name)},${escapeCsv(repo.full_name)}`
      );
      return [csvHeader, ...csvRows].join('\n');
    
    default:
      return JSON.stringify(repoData);
  }
}

// Filter repositories based on visibility and fork settings
function filterRepositories(repositories, visibility, includeForks) {
  let filtered = repositories;

  // Filter by visibility
  if (visibility && visibility !== 'all') {
    filtered = filtered.filter(repo => {
      if (visibility === 'public') return !repo.private;
      if (visibility === 'private') return repo.private;
      if (visibility === 'internal') return repo.visibility === 'internal';
      return true;
    });
  }

  // Filter by fork status
  if (includeForks !== 'true') {
    if (includeForks === 'false') {
      filtered = filtered.filter(repo => !repo.fork);
    } else if (includeForks === 'only') {
      filtered = filtered.filter(repo => repo.fork);
    }
  }

  return filtered;
}

async function run() {
  try {
    // Get inputs
    const owner = core.getInput('owner', { required: true });
    const token = core.getInput('token', { required: true });
    const branchName = core.getInput('branch-name');
    const outputFormat = core.getInput('output-format') || 'json';
    const visibility = core.getInput('visibility') || 'all';
    const includeForks = core.getInput('include-forks') || 'true';
    const maxRepos = parseInt(core.getInput('max-repos') || '1000', 10);
    const startPage = parseInt(core.getInput('page') || '1', 10);
    const perPage = Math.min(parseInt(core.getInput('per-page') || '100', 10), 100);

    // Create GitHub client
    const octokit = github.getOctokit(token);

    core.info(`Fetching repositories for owner: ${owner}`);
    core.info(`Max repos limit: ${maxRepos === 0 ? 'unlimited' : maxRepos}`);
    core.info(`Starting from page: ${startPage}, per page: ${perPage}`);

    // Get all repositories for the owner
    const repositories = [];
    let page = startPage;
    let hasMorePages = true;
    let isOrganization = true;

    while (hasMorePages && (maxRepos === 0 || repositories.length < maxRepos)) {
      try {
        let response;
        
        // Try as an organization first (only on first iteration)
        if (isOrganization) {
          try {
            core.info(`Fetching page ${page} (${repositories.length} repos so far)...`);
            response = await octokit.rest.repos.listForOrg({
              org: owner,
              per_page: perPage,
              page: page,
              type: 'all'
            });
          } catch (error) {
            if (error.status === 404) {
              // Not an organization, switch to user mode
              core.info(`${owner} is not an organization, trying as a user...`);
              isOrganization = false;
              page = 1; // Start from page 1 for user mode
              
              core.info(`Fetching page ${page} (${repositories.length} repos so far)...`);
              response = await octokit.rest.repos.listForUser({
                username: owner,
                per_page: perPage,
                page: page,
                type: 'all'
              });
            } else {
              throw error;
            }
          }
        } else {
          // Already determined it's a user
          core.info(`Fetching page ${page} (${repositories.length} repos so far)...`);
          response = await octokit.rest.repos.listForUser({
            username: owner,
            per_page: perPage,
            page: page,
            type: 'all'
          });
        }

        if (response.data.length === 0) {
          // No more repositories
          hasMorePages = false;
        } else {
          // Add repositories, respecting max-repos limit
          const remainingSlots = maxRepos === 0 ? response.data.length : Math.min(response.data.length, maxRepos - repositories.length);
          const reposToAdd = response.data.slice(0, remainingSlots);
          repositories.push(...reposToAdd);
          
          // Check if we should continue
          if (response.data.length < perPage) {
            // Received fewer repos than requested, likely the last page
            hasMorePages = false;
          } else if (maxRepos > 0 && repositories.length >= maxRepos) {
            // Reached the max repos limit
            core.info(`Reached max repos limit of ${maxRepos}`);
            hasMorePages = false;
          } else {
            page++;
          }
        }
      } catch (error) {
        // If we encounter an error, log it and terminate
        core.error(`Error fetching page ${page}: ${error.message}`);
        throw error;
      }
    }

    core.info(`Found ${repositories.length} repositories`);

    // Apply filters
    const filteredRepositories = filterRepositories(repositories, visibility, includeForks);
    core.info(`After filtering: ${filteredRepositories.length} repositories (visibility: ${visibility}, include-forks: ${includeForks})`);

    // Create a simplified list of repositories
    const repoList = filteredRepositories.map(repo => ({
      name: repo.name,
      full_name: repo.full_name,
      url: repo.html_url,
      default_branch: repo.default_branch,
      private: repo.private
    }));

    // Format and set output for all repositories
    const formattedRepos = formatRepositories(filteredRepositories, outputFormat);
    core.setOutput('repositories', formattedRepos);
    core.setOutput('repository-count', filteredRepositories.length);

    // If branch name is specified, search for it
    if (branchName) {
      core.info(`Searching for branch '${branchName}' across all repositories...`);
      
      const repositoriesWithBranch = [];

      for (const repo of filteredRepositories) {
        try {
          // Try to get the specific branch
          await octokit.rest.repos.getBranch({
            owner: owner,
            repo: repo.name,
            branch: branchName
          });

          // If we get here, the branch exists
          core.info(`✓ Branch '${branchName}' found in ${repo.full_name}`);
          repositoriesWithBranch.push({
            name: repo.name,
            full_name: repo.full_name,
            url: repo.html_url,
            branch_url: `${repo.html_url}/tree/${encodeURIComponent(branchName)}`
          });
        } catch (error) {
          if (error.status === 404) {
            // Branch doesn't exist in this repo, skip it
            core.debug(`Branch '${branchName}' not found in ${repo.full_name}`);
          } else {
            // Some other error, log it but continue
            core.warning(`Error checking branch in ${repo.full_name}: ${error.message}`);
          }
        }
      }

      core.info(`\nFound ${repositoriesWithBranch.length} repositories with branch '${branchName}'`);
      
      // Format and set output for repositories with branch
      const formattedReposWithBranch = formatRepositories(repositoriesWithBranch, outputFormat);
      core.setOutput('repositories-with-branch', formattedReposWithBranch);
      core.setOutput('repositories-with-branch-count', repositoriesWithBranch.length);

      // Create a summary
      if (repositoriesWithBranch.length > 0) {
        core.summary
          .addHeading(`Repositories with branch '${branchName}'`)
          .addList(repositoriesWithBranch.map(repo => 
            `[${repo.full_name}](${repo.branch_url})`
          ))
          .write();
      } else {
        core.summary
          .addHeading(`No repositories found with branch '${branchName}'`)
          .write();
      }
    } else {
      // Create a summary for all repositories
      core.summary
        .addHeading(`All repositories for ${owner}`)
        .addList(repoList.map(repo => 
          `[${repo.full_name}](${repo.url}) - default: ${repo.default_branch}`
        ))
        .write();
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
