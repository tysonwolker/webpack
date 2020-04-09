const System = {
	register: (name, deps, fn) => {
		if (!System.registry) {
			throw new Error("System is no initialized");
		}
		if (typeof name !== "string") {
			fn = deps;
			deps = name;
			name = "(anonym)";
		}
		if (!Array.isArray(deps)) {
			fn = deps;
			deps = [];
		}

		let entry = {
			name,
			deps,
			fn,
			executed: false,
			exports: undefined
		};

		const dynamicExport = result => {
			if (System.registry[name] !== entry) {
				throw new Error(`Module ${name} calls dynamicExport too late`);
			}
			entry.exports = result;
		};

		if (name in System.registry) {
			throw new Error(`Module ${name} is already registered`);
		}

		System.registry[name] = entry;
		entry.mod = fn(dynamicExport);
		if (deps.length > 0) {
			if (!Array.isArray(entry.mod.setters)) {
				throw new Error(
					`Module ${name} must have setters, because it has dependencies`
				);
			}
			if (entry.mod.setters.length !== deps.length) {
				throw new Error(
					`Module ${name} has incorrect number of setters for the dependencies`
				);
			}
		}
		System.registry[name] = entry;
	},
	registry: undefined,
	init: modules => {
		System.registry = {};
		if (modules) {
			for (const name of Object.keys(modules)) {
				System.registry[name] = {
					executed: true,
					exports: modules[name]
				};
			}
		}
	},
	execute: name => {
		const m = System.registry[name];
		if (!m) throw new Error(`Module ${name} not registered`);
		if (m.executed) throw new Error(`Module ${name} was already executed`);
		return System.ensureExecuted(name);
	},
	ensureExecuted: name => {
		const m = System.registry[name];
		console.log(m);
		if (!m) throw new Error(`Module ${name} not registered`);
		if (!m.executed) {
			m.executed = true;
			for (let i = 0; i < m.deps.length; i++) {
				const dep = m.deps[i];
				const setters = m.mod.setters[i];
				System.ensureExecuted(dep);
				setters(System.registry[dep].exports);
			}
			m.mod.execute();
		}
		return m.exports;
	}
};
module.exports = System;
