# Upload ORBIT to GitHub

## Upload using the website

1. Create a repository named `ORBITGAME`. Choose **Public** if you want it visible in your portfolio.
2. Use **Add file → Upload files**, or the upload link shown in an empty repository.
3. Upload the **contents** of the `orbit-game` folder. The repository root should contain `index.html`, `README.md`, `package.json`, `src/`, `assets/`, and `vendor/`.
4. Include the dotfiles if your file browser hides them. On macOS, **Command + Shift + .** shows hidden files. They include `.gitignore` and `.nojekyll`.
5. Commit the upload with a message such as `Add ORBIT 01 portfolio project`.

Do not upload only the ZIP: GitHub needs the extracted files to display the source and run the demo. Every individual file in this project is below the website's 25 MiB upload limit. See [GitHub's file upload documentation](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).

## Publish the playable demo

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select **main** and **/ (root)**, then save.
4. Wait for the deployment to finish. Open the address GitHub provides and confirm the game launches.
5. Add that address to the repository's **About → Website** field, then use it in your portfolio.

The `.nojekyll` file allows the static files to be published directly. No custom build command is required. Follow [GitHub's Pages setup documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) for account availability and current setup details.

## Upload using Git instead

Create an empty GitHub repository first, then run these commands from inside the project folder. The remote below points to this project's repository:

```sh
git init -b main
git add .
git commit -m "Add ORBIT 01 portfolio project"
git remote add origin https://github.com/Adri-Lima/ORBITGAME.git
git push -u origin main
```

Authenticate using your normal GitHub sign-in method. No credentials belong in the project files.

## Repository presentation

Suggested description:

> A 3D space survival game built with JavaScript, Three.js and Web Audio, featuring unlockable abilities, cosmetic progression and a local save system.

Suggested topics: `javascript`, `threejs`, `webgl`, `game`, `web-audio`, `portfolio`.

The README includes a real screenshot, controls, architecture notes, and test instructions. Add the verified demo URL after publishing.
