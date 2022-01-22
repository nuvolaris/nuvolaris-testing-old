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

// eslint-disable-next-line max-len
const isBase64Pattern = new RegExp('^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$');

/**
 * Creates a payload for the initialization of a container
 * @param {function} code code to run in a container
 * @param {string} main name of the main function
 * @param {object} env env variables
 * @return {object} payload with code, main function and env vars
 */
function initPayload(code, main = 'main', env = null) {
  let b = false;
  if (code) {
    const t = code.trim();
    b = (t.length > 0) && (t.length % 4 == 0) && isBase64Pattern.test(t);
  }

  return {
    value: {
      code,
      main,
      binary: b,
      env,
    },
  };
}

describe('Nodejs v14 Runtime', () => {
  const nodejs14Image = 'openwhisk/action-nodejs-v14';
  let containerData;
  let api;

  /**
   * Runs code function in container
   * @param {function} code to run in container
   * @return {object} result of the code
   */
  async function runWithActionContainer(code) {
    return await runCodeInContainer(code, containerData.name);
  }

  beforeAll(async () => {
    containerData = await setupContainer(nodejs14Image);
    api = mockContainerApi(containerData.ip, containerData.port);
  });

  afterAll(() => {
    const name = containerData.containerName;
    return tearDownContainer(name);
  });

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

  it.only('should run and report error for not returning a json', async () => {
    let initCode; let runCode; let out;
    const code = async () => {
      const {status} = await api.init(initPayload(null));
      initCode = status;
      const run = api.run(JsObject.empty);
      runCode = run.status;
      out = run.data;
    };

    await runWithActionContainer(code);

    expect(initCode).toBe(200);
    expect(runCode).not.toBe(200);
    const expectedResult = {error: 'The action did not return a dictionary.'};
    expect(out).toStrictEqual(expectedResult);
  });

  // it('should fail to initialize a second time', () => {

  // });

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
