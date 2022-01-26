/**
 * Class containing all the configurations for the base tests,
 * to build for each runtime and pass to the base-tests function.
 */
class TestConfig {
  /**
   * Config with an action that should not return a
   * dictionary and confirms expected error messages.
   */
  testNotReturningJson;

  /**
   * Config to check that more
   * than one initialization is not allowd
   * and confirms expected error messages.
   */
  testInitCannotBeCalledMoreThanOnce;

  /**
   * Config with the echo action and an entry point other than "main".
   */
  testEntryPointOtherThanMain;

  /**
   * Config with the echo action for different input parameters.
   * The test actions must also print hello [stdout, stderr]
   * to the respective streams.
   */
  testEcho;

  /**
   * Config with action using unicode chars.
   * The action must properly handle unicode characters in the executable,
   * receive a unicode character,
   * and construct a response with a unicode character.
   * It must also emit unicode characters correctly to stdout.
   */
  testUnicode;

  /**
   * Config with an action that constructs the activation context correctly.
   *
   * The function must return the activation context
   * consisting of the following dictionary
   * { "api_host": process.env.__OW_API_HOST,
   *  "api_key": process.env__OW_API_KEY,
   *  "namespace": process.env.__OW_NAMESPACE,
   *  "action_name": process.env.__OW_ACTION_NAME,
   *  "action_version": process.env.__OW_ACTION_VERSION,
   *  "activation_id": process.env.__OW_ACTIVATION_ID,
   *  "deadline": process.env.__OW_DEADLINE
   * }
   */
  testEnv;

  /**
   * Config with action parameters at initialization
   * time are available before an action
   * is initialized. The value of a parameter is always a
   * String (and may include the empty string).
   *
   * The function must return a dictionary
   * consisting of the following properties
   * {
   *  "SOME_VAR" : process.env.SOME_VAR,
   *  "ANOTHER_VAR": process.env.ANOTHER_VAR
   * }
   */
  testEnvParameters;

  /**
   * Config with the action to confirm it can
   * handle a large parameter (larger than 128K) when using STDIN.
   */
  testLargeInput;
}


const buildConfig = ({
  code,
  main = 'main',
  enforceEmptyOutputStream = true,
  enforceEmptyErrorStream = true,
  hasCodeStub = false,
  skipTest = false,
}) => {
  return {
    code,
    main,
    enforceEmptyOutputStream,
    enforceEmptyErrorStream,
    hasCodeStub,
    skipTest,
  };
};

module.exports = {TestConfig, buildConfig};
