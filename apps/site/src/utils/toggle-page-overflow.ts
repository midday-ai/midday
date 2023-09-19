import { useEffect } from "react";

export const hidePageOverflow = () => {
	// window.innerWidth always is including scrollbar width, where as
	// document.body.clientWidth is not including scrollbar width. So subtracting
	// the two will give us the scrollbar width. We add that to the document here
	// to prevent the page from jumping around.
	const scrollbarWidth = window.innerWidth - document.body.clientWidth + "px";
	document.documentElement.style.setProperty("padding-right", scrollbarWidth);

	// We use overflow-clip instead of overflow-hidden because overflow-hidden
	// won't work with position sticky.
	document.documentElement.classList.add("overflow-clip");
};

export const showPageOverflow = () => {
	document.documentElement.style.removeProperty("padding-right");
	document.documentElement.classList.remove("overflow-clip");
};

export const useHidePageOverflow = (hide: boolean) => {
	useEffect(() => {
		if (hide) {
			hidePageOverflow();
		} else {
			showPageOverflow();
		}
	}, [hide]);
};
