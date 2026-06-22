import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Image, Keyboard, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../context/AppContext";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Compass } from "lucide-react-native";

export default function Login() {
  const router = useRouter();
  const { userRole, setRole } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <SafeAreaView className="flex-1 bg-surface justify-center px-margin-mobile">
      {/* Decorative Blurs */}
      <View
        pointerEvents="none"
        className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[80px]"
      />
      <View
        pointerEvents="none"
        className="absolute bottom-20 left-0 w-64 h-64 bg-surface-container-highest/40 rounded-full blur-[60px]"
      />

      <Pressable onPress={Keyboard.dismiss} className="flex-1 justify-center py-6">
        <View className="w-full max-w-sm mx-auto bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
          
          {/* Header & Logo */}
          <View className="flex-row items-center gap-2 mb-stack-lg justify-center">
            <Text className="text-headline-md font-bold text-primary font-jakarta">
              Futo <Text className="text-primary font-black">Ride</Text>
            </Text>
            <View className="bg-primary/10 px-2.5 py-1 rounded-full">
              <Text className="text-[10px] font-bold text-primary uppercase">
                {userRole === "driver" ? "Driver Mode" : "Rider Mode"}
              </Text>
            </View>
          </View>

          {/* Greeting */}
          <View className="mb-stack-lg text-left">
            <Text className="text-headline-lg-mobile font-bold text-on-surface">
              Welcome Back
            </Text>
            <Text className="text-body-sm text-secondary mt-1">
              Enter your credentials to access your FUTO transit dashboard.
            </Text>
          </View>

          {error ? (
            <Text className="text-error text-body-sm mb-4 font-semibold text-center">{error}</Text>
          ) : null}

          {/* Form Fields */}
          <View className="gap-4">
            
            {/* Email field */}
            <View>
              <Text className="text-label-sm uppercase tracking-wider text-on-surface-variant mb-1 font-bold">
                Email
              </Text>
              <View className="flex-row items-center bg-surface border border-outline-variant rounded-lg px-3 py-2">
                <Mail color="#5b5e66" size={20} className="mr-2" />
                <TextInput
                  placeholder="student@futo.edu.ng"
                  placeholderTextColor="#c5c5d8"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setError("");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 text-on-surface text-body-md py-1"
                />
              </View>
            </View>

            {/* Password field */}
            <View>
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                  Password
                </Text>
                <Pressable>
                  <Text className="text-label-sm text-primary font-bold">Forgot?</Text>
                </Pressable>
              </View>
              <View className="flex-row items-center bg-surface border border-outline-variant rounded-lg px-3 py-2">
                <Lock color="#5b5e66" size={20} className="mr-2" />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#c5c5d8"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setError("");
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="flex-1 text-on-surface text-body-md py-1"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} className="p-1">
                  {showPassword ? (
                    <EyeOff color="#5b5e66" size={18} />
                  ) : (
                    <Eye color="#5b5e66" size={18} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Submit button */}
            <Pressable
              onPress={handleLogin}
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-container h-14 rounded-full flex items-center justify-center shadow-md active:scale-[0.98] transition-all mt-4"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-on-primary text-action-lg font-bold">Log In</Text>
              )}
            </Pressable>
          </View>

          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-[1px] bg-outline-variant/30" />
            <Text className="px-3 text-label-sm text-secondary uppercase tracking-widest">Or</Text>
            <View className="flex-1 h-[1px] bg-outline-variant/30" />
          </View>

          {/* Social login mock */}
          <Pressable className="w-full border border-outline-variant hover:bg-surface-container-low h-14 rounded-full flex-row items-center justify-center gap-2 active:scale-[0.98] transition-all mb-4">
            <View className="w-5 h-5 rounded-full bg-white flex items-center justify-center border border-outline-variant/30">
              <Text className="text-[10px] font-bold text-red-500">G</Text>
            </View>
            <Text className="text-on-surface text-action-lg font-bold">Continue with Google</Text>
          </Pressable>

          {/* Redirect to Sign Up */}
          <View className="flex-row justify-center mt-4">
            <Text className="text-body-sm text-secondary font-medium">Don't have an account? </Text>
            <Pressable onPress={() => router.push("/signup")}>
              <Text className="text-body-sm text-primary font-bold hover:underline">
                Create account
              </Text>
            </Pressable>
          </View>

          {/* Toggle Role directly on Login in case they need to switch */}
          <Pressable
            onPress={() => setRole(userRole === "rider" ? "driver" : "rider")}
            className="mt-6 py-2 px-3 bg-surface-container rounded-lg self-center flex-row items-center gap-1.5 active:opacity-75"
          >
            {userRole === "rider" ? (
              <>
                <ShieldCheck color="#001caa" size={14} />
                <Text className="text-[11px] text-primary font-bold">Switch to Driver login</Text>
              </>
            ) : (
              <>
                <Compass color="#001caa" size={14} />
                <Text className="text-[11px] text-primary font-bold">Switch to Student/Rider login</Text>
              </>
            )}
          </Pressable>

        </View>
      </Pressable>
    </SafeAreaView>
  );
}
