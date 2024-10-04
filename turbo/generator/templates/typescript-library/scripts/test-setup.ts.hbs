import childProcess from "node:child_process";
import url from "node:url";
import { promisify } from "node:util";
import { run } from "./setup";

const exec = promisify(childProcess.exec);

async function testSetup() {
	try {
		const { stdout: gitEmail } = await exec(
			"git config --global --get user.email",
		);

		if (!gitEmail.trim().length) {
			await exec("git config --global user.email actions@github.com");
			await exec("git config --global user.name GithubActions");
		}
	} catch (_err) {
		await exec("git config --global user.email actions@github.com");
		await exec("git config --global user.name GithubActions");
	}

	await run({
		githubUserName: "ghUserName",
		packageName: "packageName",
		userMail: "ghUserName@mail.com",
	});

	try {
		await test();
	} finally {
		await restore();
	}
}

async function test() {
	await testNoGrep("gjuchault");
	await testNoGrep("typescript-library-starter");
	await testNoGrep("template");
}

async function restore() {
	await exec("git reset HEAD~ && git checkout . && git clean -df");

	await exec("npm install");
}

async function testNoGrep(pattern: string) {
	try {
		await exec(
			`grep -r "${pattern}" --exclude-dir=node_modules --exclude-dir=.git --exclude=README.md .`,
		);
	} catch (err) {
		if ((err as unknown as Record<string, string>).stderr === "") {
			return;
		}

		throw err;
	}
}

if (import.meta.url.startsWith("file:")) {
	if (process.argv[1] === url.fileURLToPath(import.meta.url)) {
		await testSetup();
	}
}
