const setupContainer = require("./action-container").setupContainer;
const runCodeInContainer = require("./action-container").runCodeInContainer;
const tearDownContainer = require("./action-container").tearDownContainer;
const mockContainerApi = require("./container-api").mockContainerApi;

const isBase64Pattern = new RegExp('^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$');

function initPayload(code, main = "main", env = null) {
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

describe("Nodejs v14 Runtime", () => {
	const nodejs14Image = "openwhisk/action-nodejs-v14";
	let containerData;
	let api;

	async function runWithActionContainer(code) {
		await runCodeInContainer(code, containerData.name);
	}

	beforeAll(async () => {
		containerData = await setupContainer(nodejs14Image);
		api = mockContainerApi(containerData.ip, containerData.port);
	});

	afterAll(() => {
		let name = containerData.containerName;
		return tearDownContainer(name);
	});

	it("should handle initialization with no code", async () => {
		const code = async () => {
			let { status } = await api.init(initPayload("", ""));
			expect(status).not.toBe(200);
		};

		await runWithActionContainer(code);
	})

	it("should handle initialization with no content", async () => {

		const code = async () => {
			let { status, data } = await api.init({});
			expect(status).not.toBe(200);
			expect(data).toStrictEqual({ error: "Missing main/no code to execute." });
			// JsObject("error" -> JsString("The action failed to generate or locate a binary. See logs for details."))))
		};

		await runWithActionContainer(code);
	})

	// it should "run and report an error for function not returning a json object" in {

	// it should "fail to initialize a second time" in {

	// it should "invoke non-standard entry point" in {

	// it should "echo arguments and print message to stdout/stderr" in {

	// it should "handle unicode in source, input params, logs, and result" in {

	// it should "export environment variables before initialization" in {

	// it should "confirm expected environment variables" in {

	// it should "echo a large input" 

})