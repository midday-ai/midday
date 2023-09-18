import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import Feather from "@expo/vector-icons/Feather";
import { useTranslation } from "react-i18next";
import { api } from "@/utils/api";
import { cn } from "@/utils/cn";
import { transform } from "@/utils/phone";
import { useAuth } from "@/context/AuthProvider";

export default function Login() {
  const { mutateAsync: signInWithOtp } = api.auth.signInWithOtp.useMutation();
  const { mutateAsync: verifyOtp } = api.auth.verifyOtp.useMutation();

  const colorScheme = useColorScheme();
  const dynamicColor = colorScheme === "dark" ? "white" : "black";
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [verify, setVerify] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const keyboard = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const validPhone = phone.length >= 10 && phone.length < 13;

  const handleSendOtp = async () => {
    try {
      const formattedPhone = transform(phone);

      setLoadingOtp(true);
      await signInWithOtp({
        phone: formattedPhone,
      });
      setVerify(true);
      setLoadingOtp(false);
    } catch {
      setLoadingOtp(false);
    }
  };

  const handleVerifyOtp = async (token: string) => {
    try {
      const formattedPhone = transform(phone);
      setLoadingVerify(true);

      const result = await verifyOtp({
        token,
        phone: formattedPhone,
      });

      if (result) {
        await signIn(result);
      }
    } catch (error) {
      setLoadingVerify(false);
    }
  };

  const keyboardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -keyboard.height.value }],
    };
  });

  const translateStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -translateY.value }],
    };
  });

  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const scaleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    translateY.value = withTiming(270, { duration: 250 });
    opacity.value = withTiming(0, { duration: 50 });
    scale.value = withTiming(0.5, { duration: 250 });
    setOpen(true);
  };

  const handleToken = async (value: string) => {
    setToken(value);

    // Auto-submit
    if (value.length === 6) {
      await handleVerifyOtp(value);
    }
  };

  return (
    <View className="flex-1 dark:bg-black">
      <View
        className="items-center"
        style={{ marginTop: insets.top, marginBottom: insets.bottom }}
      >
        <Animated.View style={translateStyle} className="items-center">
          <Text className="font-title mt-12 text-4xl dark:text-white">
            Lasagne
          </Text>
          <Text className="mt-1 text-center text-base dark:text-white">
            {t("login.title")}
          </Text>

          <View className="flex-1 items-center justify-center">
            <Animated.View
              className="-mt-[150] h-[100] w-[100]"
              style={scaleStyle}
            >
              <Image
                source={require("../../../assets/icon.png")}
                className="h-[100] w-[100]"
              />
            </Animated.View>

            {isOpen && (
              <Animated.View
                className="mt-4 h-[140] space-y-4"
                style={{ width }}
                entering={FadeIn}
                exiting={FadeOut}
              >
                {verify && (
                  <View className="flex flex-row space-x-2">
                    <View className="flex w-[40] items-center justify-center">
                      {loadingVerify ? (
                        <ActivityIndicator color={dynamicColor} />
                      ) : (
                        <Feather
                          name="chevron-right"
                          size={25}
                          color={dynamicColor}
                        />
                      )}
                    </View>

                    <TextInput
                      selectionColor={dynamicColor}
                      autoFocus
                      placeholderTextColor={dynamicColor}
                      className="font-semibold text-black dark:text-white"
                      placeholder={t("login.smsPlaceholder")}
                      onChangeText={handleToken}
                      value={token}
                      autoComplete="one-time-code"
                      textContentType="oneTimeCode"
                    />
                  </View>
                )}

                <View
                  className="flex flex-row space-x-2"
                  style={{ opacity: verify ? 0.5 : 1 }}
                >
                  <View className="flex w-[40] items-center justify-center">
                    {loadingOtp ? (
                      <ActivityIndicator color={dynamicColor} />
                    ) : (
                      <Feather
                        name={verify ? "check" : "chevron-right"}
                        size={verify ? 20 : 25}
                        color={dynamicColor}
                      />
                    )}
                  </View>

                  <TextInput
                    selectionColor={dynamicColor}
                    autoFocus
                    placeholderTextColor={dynamicColor}
                    className="font-semibold text-black dark:text-white"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder={t("login.phonePlaceholder")}
                    autoComplete="tel"
                    onFocus={() => {
                      setVerify(false);
                      setLoadingOtp(false);
                    }}
                  />
                </View>
              </Animated.View>
            )}
          </View>
        </Animated.View>

        <Animated.View
          className="m-auto mb-5 items-center"
          style={opacityStyle}
        >
          <Pressable onPress={handlePress}>
            <Text className="mb-4 text-lg font-bold dark:text-white">
              {t("login.continue")}
            </Text>
          </Pressable>

          <Text className="text-center dark:text-white">
            {t("login.terms1")}
            <Text
              className="font-semibold underline"
              onPress={() => Linking.openURL("https://lasagne.app/terms")}
            >
              {t("login.terms2")}
            </Text>
            <Text>{t("login.terms3")}</Text>
            <Text
              className="font-semibold underline"
              onPress={() =>
                Linking.openURL("https://lasagne.app/privacy-policy")
              }
            >
              {t("login.terms4")}
            </Text>
          </Text>
        </Animated.View>
      </View>

      {isOpen && !verify && (
        <Animated.View
          className="absolute bottom-0 left-0 right-0 flex-1 items-center p-4"
          style={keyboardStyle}
        >
          <Text
            className={cn(
              "text-lg font-semibold text-black dark:text-white",
              !validPhone && "text-[#ccc]",
            )}
            onPress={handleSendOtp}
            disabled={!validPhone}
          >
            {t("login.next")}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
