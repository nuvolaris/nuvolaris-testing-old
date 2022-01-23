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
const setupContainer = require('./action-container').setupContainer;
const runCodeInContainer = require('./action-container').runCodeInContainer;
const tearDownContainer = require('./action-container').tearDownContainer;
const mockContainerApi = require('./container-api').mockContainerApi;
const buildConfig = require('./config');
const {initPayload, checkStreams} = require('./utils');

describe('Nodejs v14 Runtime', () => {
  const nodejs14Image = 'openwhisk/action-nodejs-v14';
  let containerData;
  let api;

  /**
   * Runs code function in container
   * @param {function} code to run in container
   * @return {Promise<{out, err}>} promise with the result from the code
   */
  function runWithActionContainer(code) {
    return runCodeInContainer(code, containerData.name);
  }

  beforeEach(async () => {
    containerData = await setupContainer(nodejs14Image);
    api = mockContainerApi(containerData.ip, containerData.port);
  });

  afterEach(() => tearDownContainer(containerData.name));

  it('should handle initialization with no code', async () => {
    let initCode;
    const code = async () => {
      const {status} = await api.init(initPayload('', ''));
      initCode = status;
    };

    await runWithActionContainer(code);

    expect(initCode).not.toBe(200);
  });

  it('should handle initialization with no content', async () => {
    let initCode; let out;
    const code = async () => {
      const {status, data} = await api.init({});
      initCode = status;
      out = data;
    };

    await runWithActionContainer(code);

    expect(initCode).not.toBe(200);
    expect(out).toStrictEqual({error: 'Missing main/no code to execute.'});
  });

  it('should run and report error for not returning a json', async () => {
    const config = buildConfig({
      code: `
      function main(args) {
        return "not a json object";
      }
      `, enforceEmptyErrorStream: false});

    let initCode; let runCode; let output;
    const code = async () => {
      const {status} = await api.init(initPayload(config.code));
      initCode = status;
      const run = await api.run({});
      runCode = run.status;
      output = run.data;
    };

    const {stdout, stderr} = await runWithActionContainer(code);
    expect(initCode).toBe(200);
    expect(runCode).not.toBe(200);
    const expectRes = {error: 'The action did not return a dictionary.'};
    expect(output).toStrictEqual(expectRes);


    const error = checkStreams({stdout, stderr, additionalCheck: (o, e) => {
      // some runtimes may emit an error message,
      // or for native runtimes emit the result to stdout
      if (config.enforceEmptyOutputStream) {
        let stdoutEmpty = true;
        stdoutEmpty = o.length === 0 || !o.trim();
        if (!stdoutEmpty) {
          return 'expected stdout to be empty after sentinel filter';
        }
      }
      if (config.enforceEmptyErrorStream) {
        let stderrEmpty = true;
        stderrEmpty = e.length === 0 || !e.trim();
        if (!stderrEmpty) {
          return 'expected stderr to be empty after sentinel filter';
        }
      }
      return '';
    }});
    expect(error).toBe('');
  });

  it('should fail to initialize a second time', async () => {
    const config = buildConfig({
      code: `
      function main(args) {
        return args;
      }
      `});

    const errorMessage = 'Cannot initialize the action more than once.';

    let status1; let status2; let data2;
    const code = async () => {
      const init1 = await api.init(initPayload(config.code));
      status1 = init1.status;
      const init2 = await api.init(initPayload(config.code));
      status2 = init2.status;
      data2 = init2.data;
    };


    const {stdout, stderr} = await runWithActionContainer(code);
    expect(status1).toBe(200);
    expect(status2).not.toBe(200);
    expect(data2).toStrictEqual({error: errorMessage});

    expect(checkStreams({stdout, stderr, additionalCheck: (o, e) => {
      return (o + e).includes(errorMessage);
    }, sentinelCount: 0})).toBe(true);
  });

  // it('should invoke non-standard entry point', () => {

  // });

  // it('should echo arguments and print message to stdout/stderr', () => {

  // });

  // it('should handle unicode in source, input params, logs, and result',()=> {

  // });

  // it('should export environment variables before initialization', () => {

  // });

  // it('should confirm expected environment variables', () => {

  // });

  // it('should echo a large input', () => {

  // });
});
