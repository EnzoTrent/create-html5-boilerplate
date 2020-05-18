#!/usr/bin/env node
"use strict";
const yargs_parser = require("yargs-parser");
const path = require("path");
const chalk = require("chalk");
const ora = require("ora");
const { extract } = require("pacote");
const fs = require("fs-extra");
const os = require("os");
const packageName = "html5-boilerplate";
const tempDir = os.tmpdir() + `/${packageName}-staging`;
const elapsed = require("elapsed-time-logger");

module.exports = async () => {
	const argv = yargs_parser(process.argv.slice(2), {
		alias: { release: ["r"] },
	});
	const timer = elapsed.start();
	const version = argv["release"] || "latest";
	const targetDir = path.resolve(argv["_"][0] || "./");
	const spinner = ora(`Downloading ${packageName} version '${version}' to ${targetDir}`).start();
	await fs.ensureDir(tempDir);
	try {
		const { from: nameWithVersion } = await extract(packageName + "@" + version, tempDir, {});
		spinner.text = `${nameWithVersion} copied to ${targetDir} in ${timer.get()}. Have fun!`;
	} catch (err) {
		await fs.remove(tempDir);
		if (err.code === "ETARGET") {
			spinner.fail(chalk.red(`version '${err.wanted}' not found in npm registry\navailable versions:`));
			console.log(err.versions.reverse().join(" | "));
			process.exit(1);
		} /* istanbul ignore next */ else {
			spinner.fail("Unexpected error");
			console.error(err);
			process.exit(-1);
		}
		return;
	}
	await fs.copy(tempDir + "/dist", targetDir);
	await fs.remove(tempDir);
	spinner.succeed();
	return;
};
