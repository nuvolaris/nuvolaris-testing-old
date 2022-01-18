const withContainer = require("./action-container").withContainer;

class NodeJsActionContainerTests {
	constructor(nodejsContainerImageName) {
		this.nodejsContainerImageName = nodejsContainerImageName;
	}

	async runWithActionContainer(code, env = null) {
		await withContainer(this.nodejsContainerImageName, code, env)
	}
}

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

	it("should handle initialization with no code", async () => {
		let nodejs = new NodeJsActionContainerTests("openwhisk/action-nodejs-v14");

		const code = async (actionContainer) => {
			let status = await actionContainer.init(initPayload("", ""));
			expect(status).not.toBe(200);
		};

		await nodejs.runWithActionContainer(code);
	})

})