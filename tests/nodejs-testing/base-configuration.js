const {TestConfig, buildConfig} = require('../config');

const configuration = new TestConfig();

configuration.testNotReturningJson = buildConfig({
  code: `
function main(args) {
  return "not a json object";
}
`,
  enforceEmptyErrorStream: false,
});

configuration.testInitCannotBeCalledMoreThanOnce = buildConfig({
  code: `
function main(args) {
  return args;
}
`});

configuration.testEntryPointOtherThanMain = buildConfig({
  code: `
function niam(args) {
  return args;
}`, main: 'niam',
});

configuration.testEcho = buildConfig({
  code: `
function main(args) {
  console.log('hello stdout')
  console.error('hello stderr')
  return args
}
`});

configuration.testUnicode = buildConfig({
  code: `
function main(args) {
  var str = args.delimiter + " ☃ " + args.delimiter;
  console.log(str);
  return { "winter": str };
}`});

configuration.testEnvParameters = buildConfig({
  code: `
const envargs = {
  "SOME_VAR": process.env.SOME_VAR,
  "ANOTHER_VAR": process.env.ANOTHER_VAR
}
function main(args) {
  return envargs
}`,
});

configuration.testEnv = buildConfig({
  code: `
function main(args) {
  return {
    "api_host": process.env['__OW_API_HOST'],
    "api_key": process.env['__OW_API_KEY'],
    "namespace": process.env['__OW_NAMESPACE'],
    "action_name": process.env['__OW_ACTION_NAME'],
    "action_version": process.env['__OW_ACTION_VERSION'],
    "activation_id": process.env['__OW_ACTIVATION_ID'],
    "deadline": process.env['__OW_DEADLINE']
  }
}
  `,
});

configuration.testLargeInput = buildConfig({
  code: `
function main(args) {
  return args
}`,
});

module.exports = configuration;
