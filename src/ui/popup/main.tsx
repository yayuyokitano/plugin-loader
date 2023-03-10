import { render } from "solid-js/web";
import styles from "./popup.module.scss";

function Popup() {
	return (
		<div class="popup">
			<h1 class={styles.header}>Hello World</h1>
		</div>
	)
}

const root = document.getElementById("root");
if (!root) {
	throw new Error("Root element not found");
}
render(Popup, root);
