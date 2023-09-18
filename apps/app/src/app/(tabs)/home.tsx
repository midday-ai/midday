import { Text, View } from "react-native";
import { Link } from "expo-router";

export default function Home() {
  return (
    <View className="flex-1 dark:bg-black">
      <Link href="/contest/123">
        <Text>Contest</Text>
      </Link>
    </View>
  );
}
