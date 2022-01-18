const existsSync = require("fs").existsSync;
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const platform = require("os").platform;
const axios = require('axios');

class ActionContainer {
	constructor(init, run, runMultiple) {
		this.init = init;
		this.run = run;
		// this.runMultiple = runMultiple; TODO run multiple
	}
}

const syncPost = async (host, port, endPoint, content) =>
	await axios.post(`http://${host}:${port}${endPoint}`, content).then(res => 200, err => err.response.status);


async function withContainer(imageName, code, environment = null) {
	// Prepare the data for the container
	let containerName = buildContainerName(imageName);
	let envArgs = extractEnvArgs(environment);

	// Create the container and get its IP address
	let { ip, port } = await runContainer(imageName, containerName, envArgs);

	// then create an instance of the mock container interface
	const mock = new ActionContainer(
		(value) => syncPost(ip, port, "/init", value),
		(value) => syncPost(ip, port, "/run", value),
		// (values) => concurrentSyncPost(ip, port, "/run", values) TODO concurrent sync post
	);

	// and finally run the code with it.
	let result = await runCodeInContainer(code, containerName, mock);
	return result;
}

const timer = ms => new Promise(res => setTimeout(res, ms));

const buildContainerName = (imageName) => imageName.toLowerCase().replaceAll(/[^a-z]/g, '') + Math.random();

const extractEnvArgs = (e) => e ? Object.entries(e).map(([k, v]) => `-e ${k}=${v}`).join(' ') : "";

const isDockerForMac = () => platform().toLowerCase().includes('mac') && !process.env.DOCKER_HOST;

const runContainer = async (imageName, contName, envArgs) => {
	const createContainer = async (portFwd) => {
		portFwd = portFwd ? `-p ${portFwd}:8080` : portFwd = "";
		let { code } = await execDockerCmd(`run ${portFwd} --name ${contName} ${envArgs} -d ${imageName}`)
		if (code != 0) {
			// TODO stop here
			// assert(runOut._1 == 0, "'docker run' did not exit with 0: " + runOut)
		}
		await timer(500); // let container/server come up cleanly
	}

	let ip = 'localhost';
	let port = 8988;
	if (isDockerForMac()) {// on MacOSX, where docker for mac does not permit communicating with container directly
		await createContainer(port);// port must be available or docker run will fail
	} else {
		// not "mac" i.e., docker-for-mac, use direct container IP directly (this is OK for Ubuntu, and docker-machine)
		await createContainer()
		let { code, stdout } = await execDockerCmd(`inspect --format '{{.NetworkSettings.IPAddress}}' ${contName}`)
		if (code != 0) {
			// TODO stop here 
			// assert(ipOut._1 == 0, "'docker inspect did not exit with 0")
		}
		ip = stdout.replaceAll(/[^0-9.]/g, "");
		port = 8080;
	}
	return { ip, port };
}

const runCodeInContainer = async (code, name, ac) => {
	let result = {};
	try {
		await code(ac);
		// I'm told this is good for the logs.
		await timer(100);
		let { stdout, err } = await execDockerCmd(`logs ${name}`);
		result = { out: stdout, err }
	} finally {
		await execDockerCmd(`kill ${name}`);
		await execDockerCmd(`rm ${name}`);
	}

	return result;
}

// Tying it all together, we have a method that runs docker, waits for
// completion for some time then returns the exit code, the output stream
// and the error stream.
const execDockerCmd = async (cmd) => {
	let dockerCmd = dockerCmdString(cmd);
	const out = await exec(dockerCmd).then(res => { return { code: 0, ...res } }, err => { return { code: 1, err: err.message } });
	return out;
}

const dockerCmdString = (command) => `${dockerCmd()} ${command}`;


let dockerCmdEval = "";
const dockerCmd = () => {

	// lazy eval of function
	if (dockerCmdEval) return dockerCmdEval;

	let dockerHost = process.env.DOCKER_HOST || "";
	// if (!dockerHost) {} TODO try to get it from a whisk.properties file?

	if (dockerHost) {
		dockerHost = ` --host ${dockerHost}`;
	}

	let fullDockerString = dockerBin() + dockerHost;

	// Test here that this actually works, otherwise throw a somewhat understandable error message
	exec(`${fullDockerString} info`).catch(_err => {
		throw `
Unable to connect to docker host using ${fullDockerString} as command string.
The docker host is determined using the environment variable 'DOCKER_HOST'. 
Please verify that it is set for your build/test process.\n
`;
	});

	dockerCmdEval = fullDockerString;
	return fullDockerString;
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


module.exports = {
	withContainer
}