const buildConfig = ({
  code,
  main = 'main',
  enforceEmptyOutputStream = true,
  enforceEmptyErrorStream = true,
  hasCodeStub = false,
  skipTest = false} = {}) => {
  return {
    code,
    main,
    enforceEmptyOutputStream,
    enforceEmptyErrorStream,
    hasCodeStub,
    skipTest,
  };
};

module.exports = buildConfig;
