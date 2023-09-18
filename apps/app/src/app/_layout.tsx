import "@/i18n";
import React from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import {
  BodoniModa_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/bodoni-moda";
import {
  DarkTheme as DefaultDarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
// import { TRPCProvider } from "@/utils/api";
// import { AuthProvider } from "@/context/AuthProvider";

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "white",
  },
};

const DarkTheme = {
  ...DefaultDarkTheme,
  colors: {
    ...DefaultDarkTheme.colors,
    background: "black",
    primary: "black",
    card: "black",
  },
};

const RootLayout = () => {
  const scheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    BodoniModa_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return null

  // return (
  //   <AuthProvider>
  //     <ThemeProvider value={scheme === "dark" ? DarkTheme : LightTheme}>
  //       <TRPCProvider>
  //         <GestureHandlerRootView className="flex-1">
  //           <SafeAreaProvider>
  //             <Stack screenOptions={{ headerShown: false }}>
  //               <Stack.Screen
  //                 name="(tabs)"
  //                 options={{ headerShown: false, animation: "fade" }}
  //               />

  //               <Stack.Screen
  //                 name="(auth)"
  //                 options={{ headerShown: false, animation: "none" }}
  //               />

  //               <Stack.Screen
  //                 name="settings"
  //                 options={{ presentation: "formSheet" }}
  //               />
  //               <Stack.Screen
  //                 name="add-contest"
  //                 options={{ presentation: "formSheet" }}
  //               />
  //               <Stack.Screen
  //                 name="edit-profile"
  //                 options={{ presentation: "formSheet" }}
  //               />
  //             </Stack>
  //           </SafeAreaProvider>
  //         </GestureHandlerRootView>
  //       </TRPCProvider>
  //     </ThemeProvider>
  //   </AuthProvider>
  // );
};

export default RootLayout;
