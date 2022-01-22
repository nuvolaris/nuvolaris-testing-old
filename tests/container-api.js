const axios = require('axios');


class ContainerApi {
	constructor(init, run, runMultiple) {
		this.init = init;
		this.run = run;
		// this.runMultiple = runMultiple; TODO run multiple
	}
}

// then create an instance of the mock container interface
const mockContainerApi = (ip, port) => new ContainerApi(
	(value) => syncPost(ip, port, "/init", value),
	(value) => syncPost(ip, port, "/run", value),
	// (values) => concurrentSyncPost(ip, port, "/run", values) TODO concurrent sync post
);

const syncPost = async (host, port, endPoint, content) =>
	await axios({
		method: 'POST',
		url: `http://${host}:${port}${endPoint}`,
		data: content,
		validateStatus: () => true,
	}).then(res => {
		return { status: res.status, data: res.data }
	});

module.exports = {
	mockContainerApi
}