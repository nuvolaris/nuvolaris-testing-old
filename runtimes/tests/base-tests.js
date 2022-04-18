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
const {initPayload, checkStreams, runPayload} = require('./utils');

const baseTests = (imageName, configuration) => {
  let container;
  let api;

  beforeEach(async () => {
    container = await setupContainer(imageName);
    api = mockContainerApi(container.ip, container.port);
  });

  afterEach(() => tearDownContainer(container.name));

  it('should handle initialization with no code', async () => {
    let initCode;
    const code = async () => {
      const {status} = await api.init(initPayload('', ''));
      initCode = status;
    };

    await runCodeInContainer(code, container.name);

    expect(initCode).not.toBe(200);
  });

  it('should handle initialization with no content', async () => {
    let initCode; let out;
    const code = async () => {
      const {status, data} = await api.init({});
      initCode = status;
      out = data;
    };

    await runCodeInContainer(code, container.name);

    expect(initCode).not.toBe(200);
    expect(out).toStrictEqual({error: 'Missing main/no code to execute.'});
  });

  it('should run and report error for not returning a json', async () => {
    const config = configuration.testNotReturningJson;

    let initCode; let runCode; let output;
    const code = async () => {
      const {status} = await api.init(initPayload(config.code));
      initCode = status;
      const run = await api.run(runPayload({}));
      runCode = run.status;
      output = run.data;
    };

    const {stdout, stderr} = await runCodeInContainer(code, container.name);
    expect(initCode).toBe(200);
    expect(runCode).not.toBe(200);

    const expectRes = {error: 'The action did not return a dictionary.'};
    expect(output).toStrictEqual(expectRes);

    const error = checkStreams({
      stdout, stderr, additionalCheck: (o, e) => {
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
      },
    });
    expect(error).toBe('');
  });

  it('should fail to initialize a second time', async () => {
    const config = configuration.testInitCannotBeCalledMoreThanOnce;

    const errorMessage = 'Cannot initialize the action more than once.';

    let status1; let status2; let data2;
    const code = async () => {
      const init1 = await api.init(initPayload(config.code));
      status1 = init1.status;
      const init2 = await api.init(initPayload(config.code));
      status2 = init2.status;
      data2 = init2.data;
    };

    const {stdout, stderr} =
      await runCodeInContainer(code, container.name);
    expect(status1).toBe(200);
    expect(status2).not.toBe(200);
    expect(data2).toStrictEqual({error: errorMessage});

    expect(checkStreams({
      stdout, stderr, additionalCheck: (o, e) => {
        return (o + e).includes(errorMessage);
      }, sentinelCount: 0,
    })).toBe(true);
  });

  it('should invoke non-standard entry point', async () => {
    const config = configuration.testEntryPointOtherThanMain;

    expect(config.main).not.toBe('main');

    const arg = {string: 'hello'};
    let initCode; let runCode; let out;

    const code = async () => {
      const init = await api.init(initPayload(config.code, config.main));
      initCode = init.status;

      const run = await api.run(runPayload(arg));

      runCode = run.status;
      out = run.data;
    };

    const {stdout, stderr} =
      await runCodeInContainer(code, container.name);

    expect(initCode).toBe(200);
    expect(runCode).toBe(200);
    expect(out).toStrictEqual(arg);

    const error = checkStreams({
      stdout, stderr, additionalCheck: (o, e) => {
        // some native runtimes will emit the result to stdout
        const isStdoutEmpty = (o.length === 0 || !o.trim());
        if (config.enforceEmptyOutputStream && !isStdoutEmpty) {
          return 'expected stdout to be empty after sentinel filter';
        }
        return '';
      },
    });

    expect(error).toBe('');
  });

  it('should echo arguments and print message to stdout / stderr', async () => {
    const config = configuration.testEcho;

    const argss = [
      {string: 'hello'}, {string: '❄ ☃ ❄'},
      {numbers: [42, 1]}, {object: {a: 'A'}},
    ];

    const expectedRuns = [];
    let initCode;
    const code = async () => {
      const init = await api.init(initPayload(config.code));
      initCode = init.status;
      for (let i = 0; i < argss.length; i++) {
        const run = await api.run(runPayload(argss[i]));
        const res = {runCode: run.status, out: run.data};
        expectedRuns.push(res);
      }
    };

    const {stdout, stderr} =
      await runCodeInContainer(code, container.name);

    expect(initCode).toBe(200);
    for (let i = 0; i < expectedRuns.length; i++) {
      expect(expectedRuns[i].runCode).toBe(200);
      expect(expectedRuns[i].out).toStrictEqual(argss[i]);
    }

    expect(checkStreams({
      stdout, stderr, additionalCheck: (o, e) => {
        let b = o.includes('hello stdout');
        // some languages may not support printing to stderr
        if (!config.skipTest) b = b && e.includes('hello stderr');
        return b;
      }, sentinelCount: argss.length,
    })).toBe(true);
  });

  it('should handle unicode in source, input params, logs, and result',
      async () => {
        const config = configuration.testUnicode;

        let initCode; let runRes;
        const code = async () => {
          const {status} = await api.init(initPayload(config.code));
          initCode = status;
          const run = await api.run(runPayload({delimiter: '❄'}));
          runRes = run.data;
        };

        const {stdout, stderr} =
        await runCodeInContainer(code, container.name);

        expect(initCode).toBe(200);
        expect(runRes).toStrictEqual({winter: '❄ ☃ ❄'});

        expect(checkStreams({
          stdout, stderr,
          additionalCheck: (o, _) => o.toLowerCase().includes('❄ ☃ ❄'),
        },
        )).toBe(true);
      });

  it('should export environment variables before initialization',
      async () => {
        const config = configuration.testEnvParameters;

        if (config.skipTest) {
          throw new Error('Test pending');
        } else {
          const env = {SOME_VAR: 'xyz', ANOTHER_VAR: ''};

          let initCode; let runCode; let out;
          const code = async () => {
            const payload = initPayload(config.code, config.main, env);
            const init = await api.init(payload);
            initCode = init.status;

            const run = await api.run(runPayload({}));
            runCode = run.status;
            out = run.data;
          };

          const {stdout, stderr} =
          await runCodeInContainer(code, container.name);
          expect(initCode).toBe(200);
          expect(runCode).toBe(200);
          expect(out).toStrictEqual(env);

          expect(checkStreams({
            stdout, stderr, additionalCheck: (o, e) => {
              const isStdoutEmpty = (o.length === 0 || !o.trim());
              if (config.enforceEmptyOutputStream && !isStdoutEmpty) {
                return 'expected stdout to be empty after sentinel filter';
              }
              const isStderrEmpty = (e.length === 0 || !e.trim());
              if (config.enforceEmptyErrorStream && !isStderrEmpty) {
                return 'expected stderr to be empty after sentinel filter';
              }
              return '';
            },
          })).toBe('');
        }
      });

  it('should echo a large input', async () => {
    const config = configuration.testLargeInput;
    if (config.skipTest) {
      throw new Error('Test pending');
    } else {
      const arg = {arg: 'a'.repeat(1048561)};

      let initCode; let out;
      const code = async () => {
        const init = await api.init(initPayload(config.code, config.main));
        initCode = init.status;

        const run = await api.run(runPayload(arg));
        out = run.data;
      };

      await runCodeInContainer(code);
      expect(initCode).toBe(200);
      expect(out).toStrictEqual(arg);
    }
  });
};

const baseTestsWithEnv = (imageName, configuration) => {
  afterEach(() => tearDownContainer(containerName));

  it('should confirm expected environment variables', async () => {
    const config = configuration.testEnv;

    const __OW_API_HOST = 'xyz';
    // the api host is sent as a docker run environment parameter
    const props = {
      api_key: 'abc',
      namespace: 'zzz',
      action_name: 'xxx',
      action_version: '0.0.1',
      activation_id: 'iii',
      deadline: '123',
    };

    const dockerEnv = {__OW_API_HOST};
    const cd = await setupContainer(imageName, dockerEnv);
    containerName = cd.name; // to tear down after test

    const api = mockContainerApi(cd.ip, cd.port);

    let initCode; let runCode; let out;
    const code = async () => {
      const init = await api.init(initPayload(config.code, config.main));
      initCode = init.status;

      // we omit the api host from the run payload
      // so the docker run env var is used
      const run = await api.run(runPayload({}, props));
      runCode = run.status;
      out = run.data;
    };
    const {stdout, stderr} = await runCodeInContainer(code, cd.name);
    expect(initCode).toBe(200);
    expect(runCode).toBe(200);
    expect(out).toStrictEqual({api_host: __OW_API_HOST, ...props});

    expect(checkStreams({
      stdout, stderr, additionalCheck: (o, e) => {
        const isStdoutEmpty = (o.length === 0 || !o.trim());
        if (config.enforceEmptyOutputStream && !isStdoutEmpty) {
          return 'expected stdout to be empty after sentinel filter';
        }
        const isStderrEmpty = (e.length === 0 || !e.trim());
        if (config.enforceEmptyErrorStream && !isStderrEmpty) {
          return 'expected stderr to be empty after sentinel filter';
        }
        return '';
      },
    })).toBe('');
  });
};


module.exports = {
  baseTests,
  baseTestsWithEnv,
};
