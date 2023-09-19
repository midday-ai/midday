import { Stack } from "expo-router/stack";

export default function AuthLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
			}}
		/>
	);
}
