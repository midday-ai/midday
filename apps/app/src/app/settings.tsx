import { Pressable, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/context/AuthProvider";

export default function Settings() {
  const isPresented = router.canGoBack();
  const { signOut } = useAuth();

  return (
    <View className="flex-1">
      {!isPresented && <Link href="../">Dismiss</Link>}
      <StatusBar style="light" />

      <Pressable onPress={signOut}>
        <Text>Sign out</Text>
      </Pressable>
    </View>
  );
}
