/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2018-08-15 11:37
 */

import loadjs from 'loadjs';
import 'systemjs/dist/extras/global';
import 'systemjs/dist/s';
import processTpl from './process-tpl';

function getDomain(url) {
	try {
		const href = new URL(url);
		return href.origin;
	} catch (e) {
		return '';
	}
}

function promisifySyncLoadjs(scripts) {
	return new Promise((resolve, reject) => scripts.length
		? loadjs(scripts, { async: false, success: resolve, error: reject })
		: resolve());
}

export default function importHTML(url) {

	const domain = getDomain(url);

	return fetch(url)
		.then(response => response.text())
		.then(html => {
			const { template, scripts, entry } = processTpl(html, domain);

			return {
				template,
				// return the entry script exports
				loadScripts() {

					const entryIndex = scripts.indexOf(entry);
					const preScripts = scripts.slice(0, entryIndex);
					const postScripts = scripts.slice(entryIndex + 1);

					let exports = null;

					return promisifySyncLoadjs(preScripts)
						.then(() => exports = System.import(entry))
						.then(promisifySyncLoadjs(postScripts))
						.then(() => exports);
				},
			};
		});
};
