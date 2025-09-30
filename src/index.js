const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    // Get inputs
    const owner = core.getInput('owner', { required: true });
    const token = core.getInput('token', { required: true });
    const branchName = core.getInput('branch-name');

    // Create GitHub client
    const octokit = github.getOctokit(token);

    core.info(`Fetching repositories for owner: ${owner}`);

    // Get all repositories for the owner
    const repositories = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      try {
        // Try as an organization first
        const response = await octokit.rest.repos.listForOrg({
          org: owner,
          per_page: 100,
          page: page,
          type: 'all'
        });

        repositories.push(...response.data);
        hasMorePages = response.data.length === 100;
        page++;
      } catch (error) {
        if (error.status === 404) {
          // Not an organization, try as a user
          core.info(`${owner} is not an organization, trying as a user...`);
          page = 1;
          hasMorePages = true;

          while (hasMorePages) {
            const response = await octokit.rest.repos.listForUser({
              username: owner,
              per_page: 100,
              page: page,
              type: 'all'
            });

            repositories.push(...response.data);
            hasMorePages = response.data.length === 100;
            page++;
          }
          break;
        } else {
          throw error;
        }
      }
    }

    core.info(`Found ${repositories.length} repositories`);

    // Create a simplified list of repositories
    const repoList = repositories.map(repo => ({
      name: repo.name,
      full_name: repo.full_name,
      url: repo.html_url,
      default_branch: repo.default_branch,
      private: repo.private
    }));

    // Set output for all repositories
    core.setOutput('repositories', JSON.stringify(repoList));

    // If branch name is specified, search for it
    if (branchName) {
      core.info(`Searching for branch '${branchName}' across all repositories...`);
      
      const repositoriesWithBranch = [];

      for (const repo of repositories) {
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
            branch_url: `${repo.html_url}/tree/${branchName}`
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
      core.setOutput('repositories-with-branch', JSON.stringify(repositoriesWithBranch));

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
