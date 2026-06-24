import { useRouter } from "expo-router";
import {
  Car,
  Compass,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
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
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setIsSubmitting(true);

    // Simulate network authentication
    setTimeout(() => {
      setIsSubmitting(false);
      if (userRole === "driver") {
        router.replace("/(driver)/home");
      } else {
        router.replace("/(rider)/home");
      }
    }, 1200);
  };

  const createAccount = () => {
    router.push("/sign");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      {/* Decorative Blurs */}
      <View
        pointerEvents="none"
        className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[80px]"
      />
      <View
        pointerEvents="none"
        className="absolute bottom-20 left-0 w-64 h-64 bg-surface-container-highest/40 rounded-full blur-[60px]"
      />

      {/* Background Pressable to dismiss keyboard */}
      <Pressable onPress={Keyboard.dismiss} className="absolute inset-0 z-0" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="z-10"
      >
        <View className="flex-1 justify-center px-margin-mobile py-xl max-w-md w-full mx-auto">
          {/* Brand Header */}
          <View className="items-center mb-xl">
            <Text className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight text-center">
              Futo Ride
            </Text>
            {/* Mode Indicator Badge */}
            <View className="bg-primary/10 px-3 py-1 rounded-full flex flex-row gap-1.5 items-center mt-2">
              {userRole === "rider" ? (
                <User size={12} color="#001caa" />
              ) : (
                <Car size={12} color="#001caa" />
              )}
              <Text className="text-[10px] font-bold text-primary uppercase tracking-wider">
                {userRole === "driver" ? "Driver Mode" : "Rider Mode"}
              </Text>
            </View>
          </View>

          {/* Welcome Text */}
          <View className="mb-xl text-center">
            <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-background font-bold mb-2">
              Welcome Back
            </Text>
            <Text className="font-body-md text-body-md text-secondary">
              Please enter your details to sign in.
            </Text>
          </View>

          {error ? (
            <Text className="text-error text-body-sm mb-4 font-semibold text-center">
              {error}
            </Text>
          ) : null}

          {/* Form Fields */}
          <View className="gap-md">
            {/* Email Field */}
            <View>
              <Text className="block font-label-md text-label-md text-on-surface mb-xs">
                Email
              </Text>
              <View
                className={`flex-row items-center bg-surface-container-lowest border rounded-lg px-3 py-2 ${
                  isEmailFocused
                    ? "border-primary border-2"
                    : "border-outline-variant"
                }`}
              >
                <Mail
                  color={isEmailFocused ? "#001caa" : "#757687"}
                  size={20}
                  className="mr-2"
                />
                <TextInput
                  placeholder="Enter your email"
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
                  className="flex-1 text-on-surface text-body-md py-1"
                />
              </View>
            </View>

            {/* Password Field */}
            <View>
              <Text className="block font-label-md text-label-md text-on-surface mb-xs">
                Password
              </Text>
              <View
                className={`flex-row items-center bg-surface-container-lowest border rounded-lg px-3 py-2 ${
                  isPasswordFocused
                    ? "border-primary border-2"
                    : "border-outline-variant"
                }`}
              >
                <Lock
                  color={isPasswordFocused ? "#001caa" : "#757687"}
                  size={20}
                  className="mr-2"
                />
                <TextInput
                  placeholder="Enter your password"
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
                  className="flex-1 text-on-surface text-body-md py-1"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-1"
                >
                  {showPassword ? (
                    <EyeOff
                      color={isPasswordFocused ? "#001caa" : "#757687"}
                      size={18}
                    />
                  ) : (
                    <Eye
                      color={isPasswordFocused ? "#001caa" : "#757687"}
                      size={18}
                    />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Remember Me and Forgot Password */}
            <View className="flex-row items-center justify-between mt-sm mb-lg">
              <Pressable
                onPress={() => setRememberMe(!rememberMe)}
                className="flex-row items-center"
              >
                <View
                  className={`w-4 h-4 rounded border mr-2 items-center justify-center ${
                    rememberMe
                      ? "bg-primary border-primary"
                      : "border-outline-variant bg-transparent"
                  }`}
                >
                  {rememberMe && (
                    <View className="w-1.5 h-1.5 bg-white rounded-sm" />
                  )}
                </View>
                <Text className="font-body-sm text-body-sm text-secondary">
                  Remember me
                </Text>
              </Pressable>

              <Pressable>
                <Text className="font-label-md text-label-md text-primary font-semibold hover:text-primary-container">
                  Forgot password?
                </Text>
              </Pressable>
            </View>

            {/* Primary Login Button */}
            <Pressable
              onPress={handleLogin}
              disabled={isSubmitting}
              className="w-full flex justify-center py-4 bg-primary rounded-full shadow-md active:opacity-90 active:scale-[0.98] transition-all"
            >
              <Text className="font-label-md text-label-md text-on-primary font-bold text-center">
                Log In
              </Text>
              {isSubmitting && <ActivityIndicator color="#ffffff" />}
            </Pressable>

            {/* Divider */}
            <View className="flex-row items-center my-xl">
              <View className="flex-1 h-[1px] bg-outline-variant" />
              <Text className="px-3 text-body-sm text-secondary font-medium uppercase tracking-wider">
                Or continue with
              </Text>
              <View className="flex-1 h-[1px] bg-outline-variant" />
            </View>

            {/* Social Login Button */}
            <Pressable className="w-full inline-flex justify-center items-center py-3.5 border border-outline-variant rounded-full bg-surface-container-lowest active:bg-surface-container-low transition-colors">
              <Text className="font-label-md text-label-md text-on-surface font-semibold text-center">
                Log in with Google
              </Text>
            </Pressable>

            {/* Redirect to Sign Up */}
            <View className="mt-lg flex-row justify-center items-center p-4 ">
              <Text className="font-body-sm text-body-sm text-secondary">
                Don't have an account?{" "}
              </Text>
              <Pressable onPress={createAccount} className=" p-4 ">
                <Text className="font-label-md text-label-md text-primary font-semibold hover:underline">
                  Create account
                </Text>
              </Pressable>
            </View>

            {/* Switch Role Trigger */}
            <Pressable
              onPress={() => setRole(userRole === "rider" ? "driver" : "rider")}
              className="mt-6 py-2 px-3 bg-surface-container rounded-lg self-center flex-row items-center gap-1.5 active:opacity-75"
            >
              {userRole === "rider" ? (
                <>
                  <ShieldCheck color="#001caa" size={14} />
                  <Text className="text-[11px] text-primary font-bold">
                    Switch to Driver login
                  </Text>
                </>
              ) : (
                <>
                  <Compass color="#001caa" size={14} />
                  <Text className="text-[11px] text-primary font-bold">
                    Switch to Student/Rider login
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
