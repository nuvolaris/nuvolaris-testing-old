const existsSync = require("fs").existsSync;
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const platform = require("os").platform;


const setupContainer = async (imageName, environment = null) => {
	// Prepare the data for the container
	let containerName = buildContainerName(imageName);
	let envArgs = extractEnvArgs(environment);

	// Create the container and get its IP address
	let { ip, port } = await runContainer(imageName, containerName, envArgs);
	return { containerName, ip, port };
}

const runCodeInContainer = async (code, name) => {
	let result = {};
	try {
		await code();
		// I'm told this is good for the logs.
		await timer(100);
		let { stdout, err } = await execDockerCmd(`logs ${name}`);
		result = { out: stdout, err }
	} catch {
		return { err: "error while running code in container." };
	}

	return result;
}

const tearDownContainer = async (name) => {
	await execDockerCmd(`kill ${name}`);
	await execDockerCmd(`rm ${name}`);
}

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

const timer = ms => new Promise(res => setTimeout(res, ms));

const buildContainerName = (imageName) => imageName.toLowerCase().replaceAll(/[^a-z]/g, '') + Math.random();

const extractEnvArgs = (e) => e ? Object.entries(e).map(([k, v]) => `-e ${k}=${v}`).join(' ') : "";

const isDockerForMac = () => platform().toLowerCase().includes('mac') && !process.env.DOCKER_HOST;

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
	if (dockerCmdEval) {
		return dockerCmdEval;
	}

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
	if (found) {
		return usrbindocker;
	}
	const usrlocalbindocker = "/usr/local/bin/docker";
	found = existsSync(usrlocalbindocker)
	if (found) {
		return usrlocalbindocker;
	}
	return "";
}


module.exports = {
	setupContainer,
	runCodeInContainer,
	tearDownContainer
}