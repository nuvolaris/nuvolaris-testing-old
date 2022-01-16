const isBase64Pattern = new RegExp('^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$');

const TestConfig = {
	code: "",
	main: "main",
	enforceEmptyOutputStream: true,
	enforceEmptyErrorStream: true,
	hasCodeStub: false,
	skipTest: false,
}

// Runs tests for actions which receive an empty initializer (no source or exec).
const testNoSourceOrExec = TestConfig

// Runs tests for actions which receive an empty code initializer (exec with code equal to the empty string).
const testNoSource = testNoSourceOrExec

/**
 * TODO
	* Must be defined by the runtime test suites. A typical implementation looks like this:
	*      withContainer("container-image-name", env)(code)
	* See [[ActionContainer.withContainer]] for details.
	*
	* @param env the environment to pass to the container
	* @param code the code to initialize with 
	*/
const withActionContainer = (env, code) => { }

const initPayload = (code, main = "main", env = null) => {
	let b = false;
	if (code) {
		let t = code.trim();
		b = (t.length > 0) && (t.length % 4 == 0) && isBase64Pattern.test(t);
	}

	return {
		value: {
			code,
			main,
			binary: b,
			env
		}
	}
}

// let nodejsContainerImageName = "openwhisk/action-nodejs-v14"
// let nodejsTestDockerImageName = "nodejs14docker"

class NodeJsActionContainerTests {
	constructor(nodejsContainerImageName, nodejsTestDockerImageName, isTypeScript = false)

	withActionContainer(env = null, code) {
		withContainer(this.nodejsContainerImageName, env)(code)
	}
}

describe("Nodejs v14 Runtime", () => {
	it("should handle initialization with no code", () => {
		console.log("Hello")

		let config = testNoSource

		let(out, err) = withActionContainer({}, c => {
			let(initCode, out) = c.init(initPayload("", ""));
			if (config.hasCodeStub) {
				expect(initCode).toBe(200)
			} else {
				expect(initCode).Not.toBe(200)
			}
		})
	})
})
