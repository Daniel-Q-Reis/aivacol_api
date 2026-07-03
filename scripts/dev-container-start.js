const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function run(command, args) {
  const child = spawn(command, args, { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code ?? 1));
}

function hasStartDevScript() {
  const packageJsonPath = path.join(process.cwd(), "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    return Boolean(packageJson.scripts && packageJson.scripts["start:dev"]);
  } catch (_error) {
    return false;
  }
}

function startApplication() {
  if (hasStartDevScript()) {
    console.log("[app] package.json with start:dev detected, booting Nest dev server");
    run("npm", ["run", "start:dev"]);
    return;
  }

  console.log("[app] Nest scaffold not available yet, booting placeholder server");
  run(process.execPath, [path.join(__dirname, "placeholder-app.js")]);
}

const waitScript = path.join(__dirname, "wait-for-deps.js");
const waiter = spawn(process.execPath, [waitScript], { stdio: "inherit" });

waiter.on("exit", (code) => {
  if (code !== 0) {
    process.exit(code ?? 1);
    return;
  }

  startApplication();
});
