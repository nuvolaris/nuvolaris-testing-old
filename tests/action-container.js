/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */
const existsSync = require('fs').existsSync;
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const platform = require('os').platform;


const setupContainer = async (imageName, environment = null) => {
  // Prepare the data for the container
  const containerName = buildContainerName(imageName);
  const envArgs = extractEnvArgs(environment);

  // Create the container and get its IP address
  const {ip, port} = await runContainer(imageName, containerName, envArgs);
  return {containerName, ip, port};
};

const runCodeInContainer = async (code, name) => {
  try {
    await code();
    await timer(100); // good for the logs.
    const {stdout, err} = await execDocker(`logs ${name}`);
    return {out: stdout, err};
  } catch {
    return {err: 'error while running code in container.'};
  }
};

const tearDownContainer = async (name) => {
  await execDocker(`kill ${name}`);
  await execDocker(`rm ${name}`);
};

const runContainer = async (imageName, contName, envArgs) => {
  const createContainer = async (portFwd) => {
    portFwd = portFwd ? `-p ${portFwd}:8080` : portFwd = '';

    const cmd = `run ${portFwd} --name ${contName} ${envArgs} -d ${imageName}`;
    const {code} = await execDocker(cmd);
    if (code != 0) {
      // TODO stop here
      // assert(runOut._1 == 0, "'docker run' did not exit with 0: " + runOut)
    }
    await timer(500); // let container/server come up cleanly
  };

  let ip = 'localhost';
  let port = 8988;
  // on MacOSX docker for mac doesnt allow direct communication with container
  if (isDockerForMac()) {
    await createContainer(port);// port must be available or run will fail
  } else {
    // not "mac" do use container IP directly (OK for Ubuntu and docker-machine)
    await createContainer();
    const cmd = `inspect --format '{{.NetworkSettings.IPAddress}}' ${contName}`;
    const {code, stdout} = await execDocker(cmd);
    if (code != 0) {
      // TODO stop here
      // assert(ipOut._1 == 0, "'docker inspect did not exit with 0")
    }
    ip = stdout.replaceAll(/[^0-9.]/g, '');
    port = 8080;
  }
  return {ip, port};
};

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

const buildContainerName = (imageName) =>
  imageName.toLowerCase().replaceAll(/[^a-z]/g, '') + Math.random();

const extractEnvArgs = (e) =>
  e ? Object.entries(e).map(([k, v]) => `-e ${k}=${v}`).join(' ') : '';

const isDockerForMac = () =>
  platform().toLowerCase().includes('mac') && !process.env.DOCKER_HOST;

// Tying it all together, we have a method that runs docker, waits for
// completion for some time then returns the exit code, the output stream
// and the error stream.
const execDocker = async (cmd) => {
  const dockerCmd = dockerCmdString(cmd);
  const out = await exec(dockerCmd).then((res) => {
    return {code: 0, ...res};
  }, (err) => {
    return {code: 1, err: err.message};
  });
  return out;
};

const dockerCmdString = (command) => `${dockerCmd()} ${command}`;


let dockerCmdEval = '';
const dockerCmd = () => {
  // lazy eval of function
  if (dockerCmdEval) {
    return dockerCmdEval;
  }

  let dockerHost = process.env.DOCKER_HOST || '';
  // if (!dockerHost) {} TODO try to get it from a whisk.properties file?

  if (dockerHost) {
    dockerHost = ` --host ${dockerHost}`;
  }

  const fullDockerString = dockerBin() + dockerHost;

  // Test here that this actually works, else throw an error message
  exec(`${fullDockerString} info`).catch((_err) => {
    throw new Error(`
Unable to connect to docker host using ${fullDockerString} as command string.
The docker host is determined using the environment variable 'DOCKER_HOST'. 
Please verify that it is set for your build/test process.\n
`);
  });

  dockerCmdEval = fullDockerString;
  return fullDockerString;
};

/**
 * Check that docker is available on the machine and get its exec path
 * This fails if the docker binary couldn't be located.
 * @return {string} docker command string
 */
function dockerBin() {
  const usrbindocker = '/usr/bin/docker';
  let found = existsSync(usrbindocker);
  if (found) {
    return usrbindocker;
  }
  const usrlocalbindocker = '/usr/local/bin/docker';
  found = existsSync(usrlocalbindocker);
  if (found) {
    return usrlocalbindocker;
  }
  return '';
}


module.exports = {
  setupContainer,
  runCodeInContainer,
  tearDownContainer,
};
