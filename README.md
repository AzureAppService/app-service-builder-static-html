# App Service Builder / static-html

A dependency-free HTML sample for Azure App Service Builder. Builder publishes
the contents of `public/` directly: there is no build step, Oryx platform, or
running server in the deployment. `serve.mjs` is only a local development helper.

## Preview

![Static HTML sample with an oversized greeting, rose accents, and an illustrative HTML source sheet](https://github.com/user-attachments/assets/e6537c29-7808-4c3c-90d7-fc93b8aa5b9e)

**Private Preview:** use this sample for development and testing only. Live
end-to-end qualification is pending; local checks do not establish that GitHub
authorization or deployment works in your selected preview environment.

## Features

* A browser-ready greeting at `/`.
* A static `/health` asset that returns `OK`.
* A root-level `builder.yaml` that deploys only `public/`.
* Dependency-free local serving and automated HTTP checks.
* A responsive showcase with an illustrative HTML source sheet, light and dark
  color schemes, and a keyboard-accessible health-check link. Styles are inline;
  no external fonts, images, or runtime dependencies are loaded.

## Getting Started

### Prerequisites

For local development and tests, install [Node.js 24](https://nodejs.org/) and
[Git](https://git-scm.com/). No npm packages or Builder CLI installation are
required.

For deployment, you need a GitHub account, authorized App Service Builder Private
Preview access, and an existing Azure subscription and resource group available
to that preview. Use the preview target and location provided by its owner; this
sample does not establish regional availability or production service guarantees.

### Installation

Fork [this repository](https://github.com/AzureAppService/app-service-builder-static-html/fork)
to your own GitHub account so you can push changes. Clone your fork, replacing
`<your-github-account>` with its owner:

```sh
git clone https://github.com/<your-github-account>/app-service-builder-static-html.git
cd app-service-builder-static-html
```

The app is self-contained at the repository root; no parent repository files,
subtree extraction, or ZIP download are needed.

The single component omits `path`, whose public URL mount defaults to `/`;
this is separate from the repository/source root directory.
Its explicit `role: static` and `output: public` publish only `public/`.

### Quickstart

From the repository root:

```sh
node serve.mjs
```

Open `http://localhost:8080/`. The page displays
`App Service Builder / static-html` and
`Hello from a browser-ready static sample.`. Its headline reads
`Simply static. Ready to say hello.`. The source sheet is an illustration, not
an editor or a live deployment status. The color scheme follows your browser
preference; `?scoutTheme=light` or `?scoutTheme=dark` selects a scheme explicitly.
Check the static health asset:

```sh
curl -i http://localhost:8080/health
```

Expect HTTP 200 and `OK`. Stop the helper with Ctrl+C. It binds
`0.0.0.0:8080`, so use it only on a trusted development network.
Port 8080 must be free for both local serving and tests.

### Validation

Stop any local helper, then run:

```sh
node --check serve.mjs
node --test serve.test.mjs
```

The test copies only the app manifest, helper, and public assets to a temporary
standalone directory, checks the manifest, and exercises `/`, `/health`, and
missing files. It stops its own helper and removes its temporary files.
GitHub Actions runs the same checks. These are local HTTP checks, not a browser
test or live preview deployment.

### Deploy your fork with Builder Portal

Follow the [Portal quickstart](https://builderapps.azure.com/docs/quickstarts/portal/)
for your authorized Private Preview environment:

1. Open Builder Portal and select the existing subscription and resource group
   intended for your development or test app.
2. Sign in to GitHub through Portal and authorize the Builder GitHub app for
   your fork. If access requires an organization owner's approval, obtain that
   approval before selecting the source.
3. Create an app with GitHub as its source. Select
   `<your-github-account>/app-service-builder-static-html`, branch `main`, and
   the repository root as the app source root. `builder.yaml` already points
   the static component at `public/`; do not select `public/` as the source root.
4. Start deployment and wait for its successful terminal state. An accepted
   request or a created app is not a completed deployment.
5. Use the runtime URL shown by Portal to check `/` and `/health`. Expect the
   greeting page and HTTP 200 with `OK`, respectively.

Builder uses committed GitHub source, not uncommitted local files.

### Update and redeploy

Edit `public/index.html`, commit, and push to your fork's `main` branch:

```sh
git add public/index.html
git commit -m "Update the static greeting"
git push origin main
```

Then explicitly deploy from Builder Portal and wait for completion before
checking the runtime URL again. Automatic deployment on push is not qualified
by this sample.

This plain HTML sample does not read environment variables. Saving variables
does not substitute values into its static assets; even **Save and deploy**
does not add HTML templating. See the
[variables guide](https://builderapps.azure.com/docs/guides/variables/) for
Portal behavior. Never put credentials in public assets.

### Cleanup

In Builder Portal, delete only the Builder app you created for this sample,
confirm when prompted, and wait for deletion to complete. Do not delete a shared
resource group or subscription. App deletion does not delete your GitHub fork
or separately created Azure resources.

## Demo

The sample itself is the demo: `public/index.html` is the greeting page, and
`public/health` is its health asset. Both are served directly by Builder.
The local helper, tests, and README are outside the deployed `public/` directory.

## Resources

* [App Service Builder documentation](https://builderapps.azure.com/docs/)
* [Portal quickstart](https://builderapps.azure.com/docs/quickstarts/portal/)
* [Sample catalog](https://builderapps.azure.com/docs/samples/)
* [Variables guide](https://builderapps.azure.com/docs/guides/variables/)
* [Contributing](CONTRIBUTING.md)
* [Microsoft Open Source Code of Conduct](.github/CODE_OF_CONDUCT.md)
* [MIT license](LICENSE.md)
