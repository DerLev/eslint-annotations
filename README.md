# eslint-annotations

[![CI](https://github.com/DerLev/eslint-annotations/actions/workflows/integration.yml/badge.svg?branch=main&event=push)](https://github.com/DerLev/eslint-annotations/actions/workflows/integration.yml)

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

> **Warning**  
> If you don't specify either `eslint-report` or `typescript-log`
> the action won't do anything

```yaml
- uses: DerLev/eslint-annotations@v1
  with:
    eslint-report: eslint_report.json
    typescript-log: typescript.log
```

### Options

> **Note**  
> If you don't specify one of the filepaths the respective annotation script is skipped.  
> Not specifying both makes this action just pass and not do anything.

| Name                           | Description                                                  | Required | Default             |
|--------------------------------|--------------------------------------------------------------|----------|---------------------|
| `eslint-report`                | Location of the ESLint report JSON file                      | ✗        | None                |
| `eslint-annotation-prefix`     | Prefix for ESLint annotations                                | ✗        | `ESLint Rule:`      |
| `typescript-log`               | Location of Typescript log file                              | ✗        | None                |
| `typescript-annotation-prefix` | Prefix for Typescript annotations                            | ✗        | `Typescript Error:` |
| `error-on-warn`                | Whether the action should fail when ESLint outputs a warning | ✗        | `false`             |

### Setup

The following example uses the scripts of the `package.json` shown below and 
**yarn** as a package manager.

> **Note**  
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

---

`.github/workflows/integration.yml`

```yaml
name: CI
on:
  push:

jobs:
  lint-and-check:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v3
      - name: Setup Nodejs environment
        uses: actions/setup-node@v3
        with:
          node-version: 16
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
        uses: DerLev/eslint-annotations@v1
        with:
          eslint-report: eslint_report.json
          typescript-log: typescript.log

```

### Support

Pull Requests and Issues with bugs, new features or even typos in the 
documentation are always welcome.

#### Supported versions

| Version   | Package Manager | Supported            |
|-----------|-----------------|----------------------|
| `v1.0.2`  | **npm**         | :white_check_mark:   |
|           | **yarn**        | :white_check_mark:   |
|           | **pnpm**        | :warning: Not tested |
| `>v1.0.2` | *any*           | :x:                  |

---

### Future versions might include

- [ ] Markdown job summary
- [ ] Seperate job for annotations to easily set required jobs in branch protection rules
