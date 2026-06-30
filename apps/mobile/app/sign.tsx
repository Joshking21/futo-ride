import { handleUserRegistration } from "@/config/userRegistration";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Key,
  Lock,
  Mail,
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
import KekeIcon from "../components/KekeIcon";
import { useApp } from "../context/AppContext";

export default function Sign() {
  const router = useRouter();
  const { userRole } = useApp();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);

  const handleSignup = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      const result = await handleUserRegistration({
        email,
        password,
        fullName,
        userRole,
      });
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

  return (
    <SafeAreaView
      className="flex-1 bg-surface-bright"
      edges={["top", "bottom"]}
    >
      {/* Top Header with Back Button */}
      <View className="px-margin-mobile pt-4 flex-row items-center justify-between z-20">
        <Pressable
          onPress={() => router.back()}
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
        {/* Background Pressable to dismiss keyboard */}
        <Pressable
          onPress={Keyboard.dismiss}
          className="absolute inset-0 z-0"
        />

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
              Sign <Text className="text-primary">Up</Text>
            </Text>
            <Text className="font-jakarta text-body-sm text-secondary text-center mt-2 px-4 leading-5">
              Create your account to start riding with Futo Ride.
            </Text>
          </View>

          {error ? (
            <Text className="text-error text-body-sm mb-4 font-semibold text-center">
              {error}
            </Text>
          ) : null}

          {/* Form Fields */}
          <View className="gap-4">
            {/* Full Name */}
            <View
              className={`flex-row items-center bg-white border rounded-2xl px-4 py-3.5 shadow-sm shadow-black/5 ${
                isNameFocused ? "border-primary" : "border-outline-variant/10"
              }`}
            >
              <User
                color={isNameFocused ? "#001caa" : "#757687"}
                size={20}
                className="mr-3"
              />
              <TextInput
                placeholder="Full name"
                placeholderTextColor="#c5c5d8"
                value={fullName}
                onChangeText={(val) => {
                  setFullName(val);
                  setError("");
                }}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
                underlineColorAndroid="transparent"
                className="flex-1 text-on-surface text-body-sm py-0.5 font-jakarta"
              />
            </View>
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
            {/* Confirm Password Field */}
            <View
              className={`flex-row items-center bg-white border rounded-2xl px-4 py-3.5 shadow-sm shadow-black/5 ${
                isConfirmFocused
                  ? "border-primary"
                  : "border-outline-variant/10"
              }`}
            >
              <Key
                color={isConfirmFocused ? "#001caa" : "#757687"}
                size={20}
                className="mr-3"
              />
              <TextInput
                placeholder="Confirm password"
                placeholderTextColor="#c5c5d8"
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  setError("");
                }}
                onFocus={() => setIsConfirmFocused(true)}
                onBlur={() => setIsConfirmFocused(false)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                underlineColorAndroid="transparent"
                className="flex-1 text-on-surface text-body-sm py-0.5 font-jakarta"
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="p-1"
              >
                {showConfirmPassword ? (
                  <EyeOff
                    color={isConfirmFocused ? "#001caa" : "#757687"}
                    size={20}
                  />
                ) : (
                  <Eye
                    color={isConfirmFocused ? "#001caa" : "#757687"}
                    size={20}
                  />
                )}
              </Pressable>
            </View>
            {/* Primary Signup Button */}
            <Pressable
              onPress={handleSignup}
              disabled={isSubmitting}
              className={`w-full h-14 bg-primary rounded-full items-center justify-center shadow-md active:opacity-95 active:scale-[0.99] flex-row ${isSubmitting? "bg-primary/30":""}`}
            >
              <Text className="font-jakarta text-action-lg text-on-primary font-bold text-center mr-2">
                Sign Up
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
            {/* Google Signup Button */}
            <Pressable className="w-full h-14 bg-white border border-outline-variant/15 rounded-2xl flex-row items-center justify-center gap-3 shadow-sm shadow-black/5 active:bg-surface-container-low ">
              {/* Google G icon simulation */}
              <View className="w-5 h-5 rounded-full bg-red-500 items-center justify-center">
                <Text className="text-[10px] text-white font-bold">G</Text>
              </View>
              <Text className="font-jakarta text-body-md text-on-surface font-bold text-center">
                Sign up with Google
              </Text>
            </Pressable>{" "}
            {/* Already have account */}
            <View className="flex-row justify-center items-center pb-8">
              <Text className="font-jakarta text-body-sm text-secondary">
                Already have an account?{" "}
              </Text>
              <Pressable onPress={() => router.replace("/login")}>
                <Text className="font-jakarta text-body-sm text-primary font-bold">
                  Log in
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
