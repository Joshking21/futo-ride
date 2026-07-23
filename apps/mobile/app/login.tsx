import KekeIcon from "@/components/KekeIcon";
import BusIcon from "@/components/BusIcon";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "@/config/firebaseConfig";
import { handleUserSignIn } from "@/config/userSignIn";
import { useNavigation, useRouter } from "expo-router";
import {
  ArrowLeft,
  CarFront,
  CircleUserRound,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ChevronDown,
  Check,
} from "lucide-react-native";
import { useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const [transitMode, setTransitMode] = useState<"keke" | "bus">("keke");
  const [showTransitDropdown, setShowTransitDropdown] = useState(false);

  useEffect(() => {
    const loadTransitMode = async () => {
      try {
        const stored = await AsyncStorage.getItem("driver_transit_mode");
        if (stored === "bus" || stored === "keke") {
          setTransitMode(stored);
        }
      } catch (e) {
        console.warn("Failed to load driver transit mode:", e);
      }
    };
    loadTransitMode();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      // 1. Authenticate with Firebase Auth via your signIn helper
      const result = await handleUserSignIn(email, password);

      if (result.success) {
        // 2. Extract the userType profile saved in your result payload
        // (Ensure handleUserSignIn fetches this from the Firestore 'users' collection using user.uid)
        const registeredUserType = result.userType?.toLowerCase().trim();
        const currentAppRole = userRole?.toLowerCase().trim();

        // 3. Role Validation Check
        if (registeredUserType && registeredUserType !== currentAppRole) {
          setIsSubmitting(false);

          // Force an instant sign-out from Firebase Auth since the context is wrong
          // This keeps their invalid token from automatically passing splash checks later
          if (auth.currentUser) {
            await auth.signOut();
          }

          // Trigger the specific warning to toggle interfaces
          setError(
            `This account is registered as a ${registeredUserType.toUpperCase()}. Please click the button below to switch your login mode.`,
          );
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
          setError("Please enter a valid email address");
          return;
        }
        // 4. Success Navigation
        setIsSubmitting(false);
        if (currentAppRole === "driver") {
          await AsyncStorage.setItem("driver_transit_mode", transitMode);
          if (transitMode === "bus") {
            router.replace("/(bus-driver)/home");
          } else {
            router.replace("/(driver)/home");
          }
        } else {
          router.replace("/(rider)/home");
        }
      } else {
        setError(result.error || "Authentication failed");
        setIsSubmitting(false);
      }
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  const createAccount = () => {
    router.push("/sign");
  };

  const navigation = useNavigation();

  // Use a mutable ref to track the number of back button taps
  const backPressCount = useRef(0);

  // useEffect(() => {
  //   // 1. Configure iOS Navigation Layout Safety
  //   if (Platform.OS === "ios") {
  //     navigation.setOptions({
  //       gestureEnabled: false, // Prevents swipe-to-go-back to login screen
  //       headerLeft: () => null, // Removes back arrows from top layouts
  //     });
  //     return; // Android-specific hardware back button logic skips iOS entirely
  //   }

  //   // 2. Android Double-Tap Exit Logic
  //   const onBackPress = () => {
  //     if (backPressCount.current === 1) {
  //       // Second tap within 2 seconds -> Completely shut down the app process
  //       BackHandler.exitApp();
  //       return true;
  //     }

  //     // First tap -> Trigger a Toast reminder and bump count
  //     backPressCount.current = 1;
  //     ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);

  //     // Reset the tap counter back to 0 if they don't tap again within 2 seconds
  //     const timeout = setTimeout(() => {
  //       backPressCount.current = 0;
  //     }, 2000);

  //     return true; // Stop native navigation from pushing them back to login screen
  //   };

  //   const subscription = BackHandler.addEventListener(
  //     "hardwareBackPress",
  //     onBackPress,
  //   );

  //   return () => {
  //     subscription.remove();
  //   };
  // }, [navigation]);

  return (
    <SafeAreaView
      className="flex-1 bg-surface-bright"
      edges={["top", "bottom"]}
    >
      {/* Background Pressable to dismiss keyboard */}
      <Pressable onPress={Keyboard.dismiss} className="absolute inset-0 z-0" />

      {/* Top Header with Back Button */}
      <View className="px-margin-mobile pt-4 flex-row items-center justify-between z-20">
        <Pressable
          onPress={() => router.replace("/")}
          className="w-12 h-12 rounded-2xl bg-white shadow-sm shadow-black/5 items-center justify-center border border-outline-variant/10 active:bg-surface-container"
        >
          <ArrowLeft color="#1A1A1A" size={24} />
        </Pressable>
        <View className="w-12" />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="z-10"
      >
        <View className="flex-1 justify-center px-margin-mobile pb-12 max-w-md w-full mx-auto">
          {/* Logo Box */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-2xl bg-white shadow-md shadow-black/5 flex items-center justify-center border border-outline-variant/10">
              {userRole === "rider" ? (
                <CircleUserRound size={54} color="#059669" />
              ) : transitMode === "bus" ? (
                <BusIcon size={54} color="#059669" />
              ) : (
                <KekeIcon size={54} color="#059669" />
              )}
            </View>
          </View>

          {/* Welcome Headline */}
          <View className="mb-8 items-center w-full">
            {userRole === "driver" ? (
              <Pressable
                onPress={() => setShowTransitDropdown(!showTransitDropdown)}
                className="flex-row items-center gap-1.5 bg-primary/10 px-4 py-2 rounded-full border border-primary/20 mb-3 active:bg-primary/20"
              >
                <Text className="font-jakarta text-body-md text-primary font-bold text-center">
                  Log in as "{transitMode === "keke" ? "Keke" : "Bus"}"
                </Text>
                <ChevronDown size={16} color="#059669" />
              </Pressable>
            ) : (
              <Text className="font-jakarta text-headline-lg text-on-surface font-bold text-center">
                Log <Text className="text-primary">In</Text>
              </Text>
            )}
            <Text className="font-jakarta text-body-sm text-secondary text-center mt-1 px-4 leading-5">
              Welcome back{" "}
              <Text className="text-primary uppercase font-extrabold tracking-wider">
                {userRole}!
              </Text>{" "}
            </Text>
            <Text className="font-jakarta text-body-sm text-secondary text-center mt-1 px-4 leading-5">
              Please log in to continue riding with Futo Ride.
            </Text>
          </View>

          {/* Transit Selection Dropdown */}
          {userRole === "driver" && showTransitDropdown && (
            <View className="w-full bg-white border border-outline-variant/10 rounded-2xl p-3 shadow-md mb-6 gap-2">
              <Text className="text-2xs text-secondary font-bold font-jakarta px-2 mb-1 uppercase tracking-wider">
                Select Transit Mode
              </Text>
              
              <Pressable
                onPress={() => {
                  setTransitMode("keke");
                  setShowTransitDropdown(false);
                }}
                className={`flex-row items-center justify-between p-3 rounded-xl ${
                  transitMode === "keke" ? "bg-primary/10 border border-primary/20" : "bg-transparent"
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <KekeIcon size={32} color="#059669" />
                  <Text className="font-jakarta text-body-sm font-bold text-on-surface">
                    Keke (Tricycle)
                  </Text>
                </View>
                {transitMode === "keke" && <Check size={18} color="#059669" />}
              </Pressable>

              <Pressable
                onPress={() => {
                  setTransitMode("bus");
                  setShowTransitDropdown(false);
                }}
                className={`flex-row items-center justify-between p-3 rounded-xl ${
                  transitMode === "bus" ? "bg-primary/10 border border-primary/20" : "bg-transparent"
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <BusIcon size={32} color="#059669" />
                  <Text className="font-jakarta text-body-sm font-bold text-on-surface">
                    Shuttle Bus
                  </Text>
                </View>
                {transitMode === "bus" && <Check size={18} color="#059669" />}
              </Pressable>
            </View>
          )}

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
                color={isEmailFocused ? "#059669" : "#757687"}
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
                color={isPasswordFocused ? "#059669" : "#757687"}
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
                    color={isPasswordFocused ? "#059669" : "#757687"}
                    size={20}
                  />
                ) : (
                  <Eye
                    color={isPasswordFocused ? "#059669" : "#757687"}
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
                  <CarFront color="#059669" size={14} />
                  <Text className="text-[11px] text-primary font-bold uppercase tracking-wider font-jakarta">
                    Switch to Driver login
                  </Text>
                </>
              ) : (
                <>
                  <User color="#059669" size={14} />
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
