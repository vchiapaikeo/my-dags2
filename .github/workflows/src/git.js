const { log, run } = require("./utils/action");

/**
 * Fetches and checks out the remote Git branch (if it exists, the fork repository will be used)
 * @param {import('./github/context').GithubContext} context - Information about the GitHub
 */
function checkOutRemoteBranch(context) {
  if (context.repository.hasFork) {
    // Fork: Add fork repo as remote
    log(`Adding "${context.repository.forkName}" fork as remote with Git`);
    run(
      `git remote add fork https://${context.actor}:${context.token}@github.com/${context.repository.forkName}.git`,
    );
  } else {
    // No fork: Update remote URL to include auth information (so auto-fixes can be pushed)
    log(`Adding auth information to Git remote URL`);
    run(
      `git remote set-url origin https://${context.actor}:${context.token}@github.com/${context.repository.repoName}.git`,
    );
  }

  const remote = context.repository.hasFork ? "fork" : "origin";

  // Fetch remote branch
  log(`Fetching remote branch "${context.branch}"`);
  run(`git fetch --no-tags --depth=1 ${remote} ${context.branch}`);

  // Switch to remote branch
  log(`Switching to the "${context.branch}" branch`);
  run(`git branch --force ${context.branch} --track ${remote}/${context.branch}`);
  run(`git checkout ${context.branch}`);
}

/**
 * Stages and commits all changes using Git
 * @param {string} message - Git commit message
 */
function commitChanges(message) {
  log(`Committing changes`);
  run(`git commit -am "${message}"`);
}

/**
 * Returns the SHA of the head commit
 * @returns {string} - Head SHA
 */
function getHeadSha() {
  const sha = run("git rev-parse HEAD").stdout;
  log(`SHA of last commit is "${sha}"`);
  return sha;
}

/**
 * Checks whether there are differences from HEAD
 * @returns {boolean} - Boolean indicating whether changes exist
 */
function hasChanges() {
  const res = run("git diff-index --quiet HEAD --", { ignoreErrors: true }).status === 1;
  log(`${res ? "Changes" : "No changes"} found with Git`);
  return res;
}

/**
 * Pushes all changes to the remote repository
 */
function pushChanges() {
  log("Pushing changes with Git");
  run("git push");
}

/**
 * Updates the global Git configuration with the provided information
 * @param {string} name - Git username
 * @param {string} email - Git email address
 */
function setUserInfo(name, email) {
  log(`Setting Git user information`);
  run(`git config --global user.name "${name}"`);
  run(`git config --global user.email "${email}"`);
}

module.exports = {
  checkOutRemoteBranch,
  commitChanges,
  getHeadSha,
  hasChanges,
  pushChanges,
  setUserInfo,
};
