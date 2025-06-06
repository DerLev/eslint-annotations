# eslint-annotations

[![CI](https://github.com/DerLev/eslint-annotations/actions/workflows/integration.yml/badge.svg?branch=main&event=push)](https://github.com/DerLev/eslint-annotations/actions/workflows/integration.yml)
[![latest release](https://img.shields.io/github/v/release/DerLev/eslint-annotations?color=2ebc4f&labelColor=343b42&label=latest%20release&logo=github&logoColor=959DA5)](https://github.com/DerLev/eslint-annotations/releases/latest)


### Description

This is yet another GitHub Action that will add annotations to your code from 
errors and warnings created by ESLint but also Typescript

### Motivation

I created this action because I want GitHub Actions to display errors and 
warnings thrown by Typescript and ESLint. Although ESLint is natively supported 
by GitHub Actions as a source for annotations I mostly use it with frameworks 
like Nextjs which don't output ESLint warnings and errors in the supported 
format. This also led me to the decision to add Typescript into the mix and 
make the ultimate GitHub Action that suits my needs.

### Snippet

This snippet just contains the minimum for annotating code through Typescript 
and ESLint. Look at [Setup](#setup) for a full workflow.

> [!WARNING]
> If you don't specify either `eslint-report` or `typescript-log`
> the action won't do anything

```yaml
- uses: DerLev/eslint-annotations@v2
  with:
    eslint-report: eslint_report.json
    typescript-log: typescript.log
```

### Options

> [!IMPORTANT]
> If you don't specify one of the filepaths the respective annotation script is skipped.  
> Not specifying both makes this action just pass and not do anything.

| Name                           | Description                                                                 | Required | Default              | `GITHUB_TOKEN` |
|--------------------------------|-----------------------------------------------------------------------------|----------|----------------------|----------------|
| `eslint-report`                | Location of the ESLint report JSON file(s)                                  | ✗        | None                 | ✗              |
| `eslint-annotation-prefix`     | Prefix for ESLint annotations                                               | ✗        | `ESLint Rule:`       | ✗              |
| `typescript-log`               | Location of Typescript log file(s)                                          | ✗        | None                 | ✗              |
| `typescript-annotation-prefix` | Prefix for Typescript annotations                                           | ✗        | `Typescript Error:`  | ✗              |
| `error-on-warn`                | Whether the action should fail when ESLint outputs a warning                | ✗        | `false`              | ✗              |
| `github-token`                 | GitHub token for accessing the API *[read here](#setting-the-github-token)* | ✗        | None                 | –              |
| `create-status-check`          | Whether to create a seperate status check or not                            | ✗        | `true`               | ✓              |
| `status-check-name`            | Name of the status check created                                            | ✗        | `eslint-annotations` | ✓              |
| `failed-attempts`              | Comma seperated IDs of failed attempts *[look here](#failed-attempts)*      | ✗        | None                 | ✓              |
| `fail-in-pr`                   | Whether the action should fail in a PR                                      | ✗        | `true`               | ✗              |
| `only-changed-in-pr`           | Whether only changed files should be annotated in a PR                      | ✗        | `true`               | ✓              |
| `add-notice-with-url`          | Toggle the creation of the summary containing the link to the status check  | ✗        | `true`               | ✓              |

> [!NOTE]
> Everything that has a check in the `GITHUB_TOKEN` column needs the `github-token` option set with *[the right permissions](#permissions-the-action-needs)*

### Setup

The following example uses the scripts of the `package.json` shown below and 
**yarn** as a package manager.

> [!NOTE]
> When using npm you need to use an argument seperator to tell npm to pass on the args to the script:  
> `npm run lint -- --output-file eslint_report.json --format json`

`package.json`

```json
{
  "scripts": {
    "build": "tsc",
    "lint": "eslint . --ext .ts"
  }
}
```

`.github/workflows/integration.yml`

```yaml
name: CI
on:
  push:

jobs:
  lint-and-check:
    name: Lint & Type Check
    runs-on: ubuntu-latest

    # this is for the GITHUB_TOKEN's permissions so the action always has
    # access to the checks and pull request claim
    # this is not needed in this example because we don't use status checks here
    permissions:
      checks: write
      pull-requests: read
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
      - name: Setup Nodejs environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "yarn"
      - name: Install Dependencies
        run: yarn --frozen-lockfile
      - name: Lint Action

        # this line stores the output of eslint in a json file.
        # be sure to change the --output-file not only here but also 
        # when calling the action
        run: yarn lint --output-file eslint_report.json --format json

        # this line will allow the workflow to proceed even though eslint 
        # failed because of an error. This is important because otherwise the 
        # action cannot annotate your code.
        continue-on-error: true

      - name: Type Check Action

        # this line stores the output of the command in a file that the action 
        # can read to annotate
        run: yarn build --noEmit > typescript.log

        # same as above
        continue-on-error: true

      - name: Annotate Code
        uses: DerLev/eslint-annotations@v2
        with:
          eslint-report: eslint_report.json
          typescript-log: typescript.log

```

### Setting the `github-token`

In order to utilize the actions full potetial you will need to set the 
`github-token` option. Here is a simple way of doing that:

```yaml
github-token: ${{ secrets.GITHUB_TOKEN }}
```

This will use the automatically generated token from GitHub Actions. Be sure to 
configure this token with [the right permissions](#permissions-the-action-needs)!

### Permissions the action needs

If you configure this action with a `GITHUB_TOKEN` you will need to assign the 
right permissions to it. In order to create status checks and list all changed 
files in a pull request the action needs these permissions set in the YAML of 
the workflow or job:

```yaml
permissions:
  checks: write
  pull-requests: read
```

### Failed Attempts

Due to my limited testing the action can have a few flaws that may result in a 
status check still running. To resolve these issues you can create a workflow 
that can be manually triggered to resolve those running checks.

The input will be the IDs of status checks seperated by a comma 
(e.g. `12345678901, 23456789012` or `12345678901,23456789012`)

> [!TIP]
> To get a check ID you will need to go to its respective page on GitHub:  
> ```
> https://github.com/DerLev/eslint-annotations/runs/12345678901
>                                this is the id -> |-----------|
> ```

`.github/workflows/fix.yml`

```yaml
name: Fix Running Checks
on:
  workflow_dispatch:
    inputs:
      failed_attempts:
        description: Failed Attempt IDs
        type: string

jobs:
  fix-running:
    name: Fix Running Checks
    runs-on: ubuntu-latest
    steps:
      - name: Test Action with test Output
        uses: DerLev/eslint-annotations@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          failed-attempts: ${{ inputs.failed_attempts }}
```

### Support

Pull Requests and Issues with bugs, new features or even typos in the 
documentation are always welcome. Please also look at the discussions of this 
repo.  
There is also a list of untested features [here](https://github.com/DerLev/eslint-annotations/discussions/64) you can contribute to.

#### Supported versions

| Version   | Package Manager | Supported            |
|-----------|-----------------|----------------------|
| `v2.0.3`  | **npm**         | :white_check_mark:   |
|           | **yarn**        | :white_check_mark:   |
|           | **pnpm**        | :warning: Not tested |
| `>v2.0.3` | *any*           | :x:                  |

---

### Future versions might include

- [ ] ~~Markdown job summary~~
- [x] ~~Seperate status check for annotations~~
- [x] ~~Only showing annotations in PRs for changed files~~
- [x] ~~Support multiple TS and ESLint input files~~
- [x] ~~Add checking of GITHUB_TOKEN for permissions~~
