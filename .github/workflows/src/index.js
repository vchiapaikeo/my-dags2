const core = require('@actions/core');
const github = require('@actions/github');
const { createCheck } = require("./github/api");
const { getInput, log } = require("./utils/action");
const { getContext } = require("./github/context");
const git = require("./git");

// Abort action on unhandled promise rejections
process.on("unhandledRejection", (err) => {
  log(err, "error");
  throw new Error(`Exiting because of unhandled promise rejection`);
});


/**
 * Parses the action configuration and runs all enabled linters on matching files
 */
async function runAction() {
  const context = getContext();  // github.context;

  const gitName = core.getInput("git_name", true);
  const commitMessage = core.getInput("commit_message", true);
  const checkName = core.getInput("check_name", true);

  log(context);
  log(gitName);
  log(commitMessage);
  log(checkName);
  log(context.workspace)
  log(context.workspace)
  log(context.workspace)

  // // If on a PR from fork: Display messages regarding action limitations
  // if (context.eventName === "pull_request" && context.repository.hasFork) {
  //   log(
  //     "This action does not have permission to create annotations on forks. You may want to run it only on `push` events. See https://github.com/wearerequired/lint-action/issues/13 for details",
  //     "error",
  //   );
  // }

  if (context.eventName === "pull_request") {
    // Fetch and check out PR branch:
    // - "push" event: Already on correct branch
    // - "pull_request" event on origin, for code on origin: The Checkout Action
    //   (https://github.com/actions/checkout) checks out the PR's test merge commit instead of the
    //   PR branch. Git is therefore in detached head state. To be able to push changes, the branch
    //   needs to be fetched and checked out first
    // - "pull_request" event on origin, for code on fork: Same as above, but the repo/branch where
    //   changes need to be pushed is not yet available. The fork needs to be added as a Git remote
    //   first
    git.checkOutRemoteBranch(context);
  }

  // const checks = [];

  // Loop over all available linters
  // for (const [linterId, linter] of Object.entries(linters)) {
  //   // Determine whether the linter should be executed on the commit
  //   if (getInput(linterId) === "true") {
  //     const fileExtensions = getInput(`${linterId}_extensions`, true);
  //     const args = getInput(`${linterId}_args`) || "";
  //     const lintDirRel = getInput(`${linterId}_dir`) || ".";
  //     const prefix = getInput(`${linterId}_command_prefix`) || "";
  //     const lintDirAbs = join(context.workspace, lintDirRel);

  //     // Check that the linter and its dependencies are installed
  //     log(`\nVerifying setup for ${linter.name}…`);
  //     await linter.verifySetup(lintDirAbs, prefix);
  //     log(`Verified ${linter.name} setup`);

  //     // Determine which files should be linted
  //     const fileExtList = fileExtensions.split(",");
  //     log(`Will use ${linter.name} to check the files with extensions ${fileExtList}`);

  //     // Lint and optionally auto-fix the matching files, parse code style violations
  //     log(
  //       `Linting files in ${lintDirAbs} with ${linter.name}…`,
  //     );
  //     const lintOutput = linter.lint(lintDirAbs, fileExtList, args, true, prefix);

  //     // Parse output of linting command
  //     const lintResult = linter.parseOutput(context.workspace, lintOutput);
  //     const summary = getSummary(lintResult);
  //     log(`${linter.name} found ${summary} (${lintResult.isSuccess ? "success" : "failure"})`);

  //     const lintCheckName = checkName
  //       .replace(/\${linter}/g, linter.name)
  //       .replace(/\${dir}/g, lintDirRel !== "." ? `${lintDirRel}` : "")
  //       .trim();

  //     checks.push({ lintCheckName, lintResult, summary });
  //   }
  // }

  // Add commit annotations after running all linters. To be displayed on pull requests, the
  // annotations must be added to the last commit on the branch. This can either be a user commit or
  // one of the auto-fix commits
  log(""); // Create empty line in logs
  const headSha = git.getHeadSha();
  log(headSha);

  
  const checks = [{
    lintCheckName: 'DAG Cost Linter',
    lintResult: {
      isSuccess: false,
      warning: [{
        path: 'dags/test_dag.yaml',
        firstLine: 29,
        lastLine: 29,
        message: "Too many nodes. This will cost us too much money",
      }],
      error: [{
        path: 'dags/test_dag.yaml',
        firstLine: 35,
        lastLine: 46,
        message: "This operator looks funky. Please fix it",
      }],
    },
    summary: '1 errors and 1 warnings',
  }, {
    lintCheckName: 'DAG Sustainability',
    lintResult: {
      isSuccess: false,
      warning: [{
        path: 'dags/test_dag.yaml',
        firstLine: 17,
        lastLine: 17,
        message: "Please lower number of retries.",
      }],
      error: [],
    },
    summary: '0 errors and 1 warnings',
  }];

  await Promise.all(
    checks.map(({ lintCheckName, lintResult, summary }) =>
      createCheck(lintCheckName, headSha, context, lintResult, summary),
    ),
  );
}

runAction();

// try {
//   // `who-to-greet` input defined in action metadata file
//   const nameToGreet = core.getInput('who-to-greet');
//   console.log(`Hello ${nameToGreet}!`);
//   const time = (new Date()).toTimeString();
//   core.setOutput("time", time);
//   // Get the JSON webhook payload for the event that triggered the workflow
//   const payload = JSON.stringify(github.context.payload, undefined, 2)
//   console.log(`The event payload: ${payload}`);
// } catch (error) {
//   core.setFailed(error.message);
// }
