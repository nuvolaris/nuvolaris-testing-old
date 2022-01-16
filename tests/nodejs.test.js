/**
 * For testing convenience, this interface abstracts away the REST calls to a
 * container as blocking method calls of this interface.
 */
class ActionContainer {

	constructor(init, run, runMultiple) {
		this.init = init;
		this.run = run;
		this.runMultiple = runMultiple;
	}
	//   run: (value) => (Int, Option[JsObject]);
	//   runMultiple: (values)(implicit ec: ExecutionContext) => Seq[(Int, Option[JsObject])];
}

const isBase64Pattern = new Regex('^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$');

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

class NodeJsActionContainerTests {
	constructor(nodejsContainerImageName, nodejsTestDockerImageName, isTypeScript = false)

	withActionContainer(env = null, code) {
		withContainer(this.nodejsContainerImageName, env)(code)
	}
}





// // We create the container... and find out its IP address...
// def createContainer(portFwd: Option[Int] = None): Unit = {
//   val runOut = awaitDocker(
//     s"run ${portFwd.map(p => s"-p $p:8080").getOrElse("")} --name $name $envArgs -d $imageName",
//     60.seconds)
//   assert(runOut._1 == 0, "'docker run' did not exit with 0: " + runOut)
// }

// // ...find out its IP address...
// val (ip, port) =
//   if (System.getProperty("os.name").toLowerCase().contains("mac") && !sys.env
//         .get("DOCKER_HOST")
//         .exists(_.trim.nonEmpty)) {
//     // on MacOSX, where docker for mac does not permit communicating with container directly
//     val p = 8988 // port must be available or docker run will fail
//     createContainer(Some(p))
//     Thread.sleep(1500) // let container/server come up cleanly
//     ("localhost", p)
//   } else {
//     // not "mac" i.e., docker-for-mac, use direct container IP directly (this is OK for Ubuntu, and docker-machine)
//     createContainer()
//     val ipOut = awaitDocker(s"""inspect --format '{{.NetworkSettings.IPAddress}}' $name""", 10.seconds)
//     assert(ipOut._1 == 0, "'docker inspect did not exit with 0")
//     (ipOut._2.replaceAll("""[^0-9.]""", ""), 8080)
//   }

// // ...we create an instance of the mock container interface...
// val mock = new ActionContainer {
//   def init(value: JsValue): (Int, Option[JsObject]) = syncPost(ip, port, "/init", value)
//   def run(value: JsValue): (Int, Option[JsObject]) = syncPost(ip, port, "/run", value)
//   def runMultiple(values: Seq[JsValue])(implicit ec: ExecutionContext): Seq[(Int, Option[JsObject])] =
//     concurrentSyncPost(ip, port, "/run", values)
// }

// try {
//   // ...and finally run the code with it.
//   code(mock)
//   // I'm told this is good for the logs.
//   Thread.sleep(100)
//   val (_, out, err) = awaitDocker(s"logs $name", 10.seconds)
//   (out, err)
// } finally {
//   awaitDocker(s"kill $name", 10.seconds)
//   awaitDocker(s"rm $name", 10.seconds)
// }
// }



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
