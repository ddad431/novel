/** Related: https://github.com/vuejs/language-tools/issues/3735#issuecomment-2351550836 */

/* eslint-disable */
import Vue from "vue";
declare module "@vue/runtime-core" {
	export interface ComponentCustomProperties {
		$t: (key: string, ...args: any[]) => string;
	}
}