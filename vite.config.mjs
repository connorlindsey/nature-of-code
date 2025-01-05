import { defineConfig } from "vite"
import fs from "fs"
import path from "path"
import glsl from "vite-plugin-glsl"

function pathToTitle(path) {
  const parts = path
    .split("/")
    .at(1)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))

  // Add '-' at the first array index
  parts.splice(1, 0, "—")

  return parts.join(" ")
}

// Build list of exercises on the home page
function generateIndex() {
  const basePath = "./exercises"
  const indexPath = "./index.html"

  const generateIndex = (dir, filelist = []) => {
    fs.readdirSync(dir)
      .reverse()
      .forEach((file) => {
        const filePath = path.join(dir, file)
        if (fs.statSync(filePath).isDirectory()) {
          generateIndex(filePath, filelist)
        } else if (file === "index.html") {
          filelist.push(filePath.replace("./", ""))
        }
      })
    return filelist
  }

  const htmlFiles = generateIndex(basePath)

  const indexContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nature of Code Exercises</title>
    <link rel="stylesheet" href="./styles.css" />
    <link
      rel="icon"
      href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐛</text></svg>"
    />
  </head>
  <body class="max-w-2xl mx-auto px-6 py-8">
    <h1 class="text-3xl">Nature of Code Exercises</h1>
    <p class="mt-2">By <a href="https://x.com/connor_lindsey">Connor Lindsey</a></p>
    <ul class="list-disc list-inside mt-3">
      ${htmlFiles.map((file) => `<li><a href="${file}">${pathToTitle(file)}</a></li>`).join("")}
    </ul>
  </body>
</html>
`
  if (fs.existsSync(indexPath)) {
    const currentContent = fs.readFileSync(indexPath, "utf-8")
    if (currentContent === indexContent) {
      return // Do not rewrite if content is the same
    }
  }

  fs.writeFileSync(indexPath, indexContent)
}

// Support multi-page setup with Vite by specifying HTML entry files
function getHtmlEntryFiles(srcDir) {
  const entry = { "index/": "index.html" }

  function traverseDir(currentDir) {
    const files = fs.readdirSync(currentDir)

    files.forEach((file) => {
      const filePath = path.join(currentDir, file)
      const isDirectory = fs.statSync(filePath).isDirectory()

      if (isDirectory) {
        // If it's a directory, recursively traverse it
        traverseDir(filePath)
      } else if (path.extname(file) === ".html") {
        // If it's an HTML file, add it to the entry object
        const name = path.relative(srcDir, filePath).replace(/\..*$/, "")
        entry[name] = filePath
      }
    })
  }

  traverseDir(srcDir)

  return entry
}

export default defineConfig({
  publicDir: "static",
  build: {
    target: "esnext",
    rollupOptions: {
      input: getHtmlEntryFiles("./exercises"),
      emptyOutDir: true,
    },
  },
  server: {
    open: true,
    fs: {
      strict: false,
    },
  },
  plugins: [
    glsl(),
    {
      name: "watch-exercises",
      configureServer(server) {
        server.watcher.add("./exercises/**")
        server.watcher.on("add", generateIndex)
        server.watcher.on("unlink", generateIndex)
        server.watcher.on("change", generateIndex)
      },
    },
    {
      name: "generate-index",
      buildStart() {
        generateIndex()
      },
    },
  ],
})
