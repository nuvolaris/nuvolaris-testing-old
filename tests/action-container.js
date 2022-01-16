const existsSync = require("fs").existsSync;
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const platform = require("os").platform;

/**
 * For testing convenience, this interface abstracts away the REST calls to a
 * container as blocking method calls of this interface.
 */
class ActionContainer {

	constructor(init, run, runMultiple) {
		this.init = init;
		this.run = run;
		this.runMultiple = runMultiple;
	}
	//   run: (value) => (Int, Option[JsObject]);
	//   runMultiple: (values)(implicit ec: ExecutionContext) => Seq[(Int, Option[JsObject])];
}


// This fails if the docker binary couldn't be located.
function dockerBin() {
	const usrbindocker = "/usr/bin/docker";
	let found = existsSync(usrbindocker)
	if (found) return usrbindocker;

	const usrlocalbindocker = "/usr/local/bin/docker";
	found = existsSync(usrlocalbindocker)
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
	const code = await proc(`${dockerCmdString} info`, 1000).then(_res => 0, _err => 1);
	if (code != 0) {
		throw `
		// Unable to connect to docker host using ${dockerCmdString} as command string.
		// The docker host is determined using the environment variable 'DOCKER_HOST'. 
		// Please verify that it is set for your build/test process.
		// `;
	}

	return dockerCmdString;
}

async function docker(command) {
	return `${await dockerCmd()} ${command}`;
}
// Tying it all together, we have a method that runs docker, waits for
// completion for some time then returns the exit code, the output stream
// and the error stream.
async function awaitDocker(cmd, msDuration = 60000) {
	let dockerCmd = await docker(cmd);
	const out = await proc(dockerCmd, msDuration).then(res => { return { code: 0, ...res } }, err => { return { code: 1, err: err.message } });
	return out;
}

// Runs a process asynchronously. Returns a future with (exitCode,stdout,stderr)
function proc(cmd, msDuration, callback) {
	return new timeoutPromise(msDuration, new Promise(async (resolve, reject) => {
		return exec(cmd).then(res => resolve(res), err => reject(err));
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

async function withContainer(imageName, environment = null) {
	let rand = Math.random();
	let name = imageName.toLowerCase().replaceAll(/[^a-z]/g, '') + rand

	let envArgs = environment ? Object.entries(environment).map(([k, v]) => `-e ${k}=${v}`).join(' ') : "";

	// We create the container... and find out its IP address...
	let createContainer = (portFwd) => {
		portFwd = portFwd ? `-p ${portFwd}:8080` : p = "";
		let { code } = awaitDocker(`run ${portFwd} --name ${name} ${envArgs} -d ${imageName}`, 60000)
		if (code != 0) {
			// TODO stop here
			// assert(runOut._1 == 0, "'docker run' did not exit with 0: " + runOut)
		}
	}

	// ...find out its IP address...
	let ip = 'localhost';
	let p = 8988;
	const timer = ms => new Promise(res => setTimeout(res, ms));
	const osName = platform();
	if (osName.includes('mac') && !process.env.DOCKER_HOST) { // on MacOSX, where docker for mac does not permit communicating with container directly
		createContainer(p);// port must be available or docker run will fail
		await timer(1500); // let container/server come up cleanly

	} else {
		// not "mac" i.e., docker-for-mac, use direct container IP directly (this is OK for Ubuntu, and docker-machine)
		createContainer()
		await timer(1500); // let container/server come up cleanly
		let { code, stdout, err } = await awaitDocker(`inspect --format '{{.NetworkSettings.IPAddress}}' ${name}`, 10000)
		if (code != 0) {
			// TODO stop here 
			// assert(ipOut._1 == 0, "'docker inspect did not exit with 0")
		}
		ip = stdout.replaceAll(/[^0-9.]/g, "");
		p = 8080;
	}

	// ...we create an instance of the mock container interface...
	const mock = new ActionContainer(
		(value) => syncPost(ip, port, "/init", value),
		(value) => syncPost(ip, port, "/run", value),
		(values) => concurrentSyncPost(ip, port, "/run", values)
	);

	
	return { ip, p };
}

async function main() {
	let code = await withContainer("openwhisk/action-nodejs-v14");
	console.log(code);
}

main();
