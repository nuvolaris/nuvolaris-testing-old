const fs = require("fs");
var util = require('util')
var { exec } = require('child_process');

// This fails if the docker binary couldn't be located.
function dockerBin() {
	const usrbindocker = "/usr/bin/docker";
	let found = fs.existsSync(usrbindocker)
	if (found) return usrbindocker;

	const usrlocalbindocker = "/usr/local/bin/docker";
	found = fs.existsSync(usrlocalbindocker)
	if (found) return usrlocalbindocker;
	return null;
}

async function dockerCmd() {

	let dockerHost = process.env.DOCKER_HOST || "";
	// if (!dockerHost) {} TODO try to get it from a whisk.properties file?

	if (dockerHost) {
		dockerHost = ` --host ${dockerHost}`;
	}
	/*
	 * The docker host is set to a provided property 'docker.host' if it's
	 * available; otherwise we check with WhiskProperties to see whether we are
	 * running on a docker-machine.
	 *
	 * IMPLICATION:  The test must EITHER have the 'docker.host' system
	 * property set OR the 'OPENWHISK_HOME' environment variable set and a
	 * valid 'whisk.properties' file generated.  The 'docker.host' system
	 * property takes precedence.
	 *
	 * WARNING:  Adding a non-docker-machine environment that contains 'mac'
	 * (i.e. 'environments/local-mac') will likely break things.
	 */
	let dockerCmdString = `${dockerBin()} ${dockerHost}`;


	// Test here that this actually works, otherwise throw a somewhat understandable error message
	await proc(`${dockerCmdString} info`, 600, (code, stdout, stderr) => {
		if (code && code != 0) {
			throw `
				|Unable to connect to docker host using ${dockerCmdString} as command string.
				|The docker host is determined using the environment variable 'DOCKER_HOST'. 
				|Please verify that it is set for your build/test process.`;
		}
		// else ok, do nothing
	});

	return dockerCmdString;
}

function docker(command) {
	return `${dockerCmd} ${command}`;
}
// Tying it all together, we have a method that runs docker, waits for
// completion for some time then returns the exit code, the output stream
// and the error stream.
async function awaitDocker(cmd, msDuration = 60000) {
	let cp = await proc(docker(cmd), msDuration, (c, so, se) => {});
	return { dode : cp.code, stdout: cp.stdout, stderr: cp.stderr };
}

// Runs a process asynchronously. Returns a future with (exitCode,stdout,stderr)
function proc(cmd, msDuration, callback) {
	return new timeoutPromise(msDuration, new Promise((resolve, reject) => {
		return resolve(exec(cmd, callback));
	}));
}

function timeoutPromise(ms, promise) {
	return new Promise((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			reject(new Error("promise timeout"))
		}, ms);
		promise.then(
			(res) => {
				clearTimeout(timeoutId);
				resolve(res);
			},
			(err) => {
				clearTimeout(timeoutId);
				reject(err);
			}
		);
	})
}


async function main() {
	const res = await awaitDocker("info", 1000);
	console.log(res.code);
}

main();

// function withContainer(imageName, environment = null) {
// 	return (code) => {
// 		let rand = Math.random();
// 		let name = imageName.toLowerCase().replaceAll(/[^a-z]/, '') + rand

// 		let envArgs = Object.entries(data).map(([k, v]) => `-e ${k}=${v}`).join(' ');

// 		// We create the container... and find out its IP address...
// 		let createContainer = (portFwd) => {
// 			let runOut = awaitDocker(`run ${portFwd.map(p => `-p ${p}:8080`).getOrElse("")} --name $name $envArgs -d $imageName`, 60000)
// 			assert(runOut._1 == 0, "'docker run' did not exit with 0: " + runOut)
// 		}
// 	}
// }