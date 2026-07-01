import { handleUserSignIn } from "@/config/userSignIn";
import { useNavigation, useRouter } from "expo-router";
import {
  ArrowLeft,
  Compass,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KekeIcon from "../components/KekeIcon";
import { useApp } from "../context/AppContext";

export default function Login() {
  const router = useRouter();
  const { userRole, setRole } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setIsSubmitting(true);

    // Simulate network authentication
    try {
      const result = await handleUserSignIn(email, password);
      if (result.success) {
        setIsSubmitting(false);
        if (userRole === "driver") {
          router.replace("/(driver)/home");
        } else {
          router.replace("/(rider)/home");
        }
      }
      setIsSubmitting(false);
    } catch (error: any) {
      setError(error.message);
      setIsSubmitting(false);
    }
    // setTimeout(() => {
    //   setIsSubmitting(false);
    //   if (userRole === "driver") {
    //     router.replace("/(driver)/home");
    //   } else {
    //     router.replace("/(rider)/home");
    //   }
    // }, 1200);
  };

  const createAccount = () => {
    router.push("/sign");
  };

  const navigation = useNavigation();

  // Use a mutable ref to track the number of back button taps
  const backPressCount = useRef(0);

  useEffect(() => {
    // 1. Configure iOS Navigation Layout Safety
    if (Platform.OS === "ios") {
      navigation.setOptions({
        gestureEnabled: false, // Prevents swipe-to-go-back to login screen
        headerLeft: () => null, // Removes back arrows from top layouts
      });
      return; // Android-specific hardware back button logic skips iOS entirely
    }

    // 2. Android Double-Tap Exit Logic
    const onBackPress = () => {
      if (backPressCount.current === 1) {
        // Second tap within 2 seconds -> Completely shut down the app process
        BackHandler.exitApp();
        return true;
      }

      // First tap -> Trigger a Toast reminder and bump count
      backPressCount.current = 1;
      ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);

      // Reset the tap counter back to 0 if they don't tap again within 2 seconds
      const timeout = setTimeout(() => {
        backPressCount.current = 0;
      }, 2000);

      return true; // Stop native navigation from pushing them back to login screen
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  return (
    <SafeAreaView
      className="flex-1 bg-surface-bright"
      edges={["top", "bottom"]}
    >
      {/* Background Pressable to dismiss keyboard */}
      <Pressable onPress={Keyboard.dismiss} className="absolute inset-0 z-0" />

      {/* Top Header with Back Button */}
      {/* <View className="px-margin-mobile pt-4 flex-row items-center justify-between z-20">
        <Pressable
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white shadow-sm shadow-black/5 items-center justify-center border border-outline-variant/10 active:bg-surface-container"
        >
          <ArrowLeft color="#1A1A1A" size={24} />
        </Pressable>
        <View className="w-12" />
      </View> */}

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="z-10"
      >
        <View className="flex-1 justify-center px-margin-mobile pb-12 max-w-md w-full mx-auto">
          {/* Logo Box */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-2xl bg-white shadow-md shadow-black/5 flex items-center justify-center border border-outline-variant/10">
              <KekeIcon size={54} color="#001caa" />
            </View>
          </View>

          {/* Welcome Headline */}
          <View className="mb-8 items-center">
            <Text className="font-jakarta text-headline-lg text-on-surface font-bold text-center">
              Log <Text className="text-primary">In</Text>
            </Text>
            <Text className="font-jakarta text-body-sm text-secondary text-center mt-2 px-4 leading-5">
              Welcome back! Please log in to continue riding with Futo Ride.
            </Text>
          </View>

          {error ? (
            <Text className="text-error text-body-sm mb-4 font-semibold text-center">
              {error}
            </Text>
          ) : null}

          {/* Form Fields */}
          <View className="gap-4">
            {/* Email Field */}
            <View
              className={`flex-row items-center bg-white border rounded-2xl px-4 py-3.5 shadow-sm shadow-black/5 ${
                isEmailFocused ? "border-primary" : "border-outline-variant/10"
              }`}
            >
              <Mail
                color={isEmailFocused ? "#001caa" : "#757687"}
                size={20}
                className="mr-3"
              />
              <TextInput
                placeholder="Email address"
                placeholderTextColor="#c5c5d8"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  setError("");
                }}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                underlineColorAndroid="transparent"
                className="flex-1 text-on-surface text-body-sm py-0.5 font-jakarta"
              />
            </View>

            {/* Password Field */}
            <View
              className={`flex-row items-center bg-white border rounded-2xl px-4 py-3.5 shadow-sm shadow-black/5 ${
                isPasswordFocused
                  ? "border-primary"
                  : "border-outline-variant/10"
              }`}
            >
              <Lock
                color={isPasswordFocused ? "#001caa" : "#757687"}
                size={20}
                className="mr-3"
              />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#c5c5d8"
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  setError("");
                }}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                underlineColorAndroid="transparent"
                className="flex-1 text-on-surface text-body-sm py-0.5 font-jakarta"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="p-1"
              >
                {showPassword ? (
                  <EyeOff
                    color={isPasswordFocused ? "#001caa" : "#757687"}
                    size={20}
                  />
                ) : (
                  <Eye
                    color={isPasswordFocused ? "#001caa" : "#757687"}
                    size={20}
                  />
                )}
              </Pressable>
            </View>

            {/* Forgot Password Link */}
            <View className="flex-row justify-end mt-1 mb-2">
              <Pressable>
                <Text className="font-jakarta text-body-sm text-primary font-bold">
                  Forgot password?
                </Text>
              </Pressable>
            </View>

            {/* Primary Login Button */}
            <Pressable
              onPress={handleLogin}
              disabled={isSubmitting}
              className={`w-full h-14 bg-primary rounded-full items-center justify-center ${isSubmitting ? "bg-primary/30" : ""} shadow-md active:opacity-95 active:scale-[0.99] flex-row `}
            >
              <Text className="font-jakarta text-action-lg text-on-primary font-bold text-center mr-2">
                Log In
              </Text>
              {isSubmitting && (
                <ActivityIndicator color="#ffffff" size="small" />
              )}
            </Pressable>
            {/* Divider */}
            <View className="flex-row items-center ">
              <View className="flex-1 h-[0.5px] bg-outline-variant/20" />
              <Text className="px-3 text-body-sm text-secondary font-medium">
                or
              </Text>
              <View className="flex-1 h-[0.5px] bg-outline-variant/20" />
            </View>

            {/* Google Login Button */}
            <Pressable className="w-full h-14 bg-white border border-outline-variant/15 rounded-2xl flex-row items-center justify-center gap-3 shadow-sm shadow-black/5 active:bg-surface-container-low">
              {/* Google G icon simulation */}
              <View className="w-5 h-5 rounded-full bg-red-500 items-center justify-center">
                <Text className="text-[10px] text-white font-bold">G</Text>
              </View>
              <Text className="font-jakarta text-body-md text-on-surface font-bold text-center">
                Log in with Google
              </Text>
            </Pressable>

            {/* Redirect to Sign Up */}
            <View className=" flex-row justify-center items-center">
              <Text className="font-jakarta text-body-sm text-secondary">
                Don't have an account?{" "}
              </Text>
              <Pressable onPress={createAccount}>
                <Text className="font-jakarta text-body-sm text-primary font-bold">
                  Create account
                </Text>
              </Pressable>
            </View>

            {/* Switch Role Trigger */}
            <Pressable
              onPress={() => setRole(userRole === "rider" ? "driver" : "rider")}
              className="mt-2 py-2.5 px-4 bg-surface-container rounded-full self-center flex-row items-center gap-2 active:opacity-75"
            >
              {userRole === "rider" ? (
                <>
                  <ShieldCheck color="#001caa" size={14} />
                  <Text className="text-[11px] text-primary font-bold uppercase tracking-wider font-jakarta">
                    Switch to Driver login
                  </Text>
                </>
              ) : (
                <>
                  <Compass color="#001caa" size={14} />
                  <Text className="text-[11px] text-primary font-bold uppercase tracking-wider font-jakarta">
                    Switch to Rider login
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
