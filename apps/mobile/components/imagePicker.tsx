import React, { useState } from "react";
import { View, Text, Pressable, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, User } from "lucide-react-native"; // Safe, direct library imports

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarChange?: (newUri: string) => void;
}

export default function AvatarUpload({ currentAvatarUrl, onAvatarChange }: AvatarUploadProps) {
  const [avatarUri, setAvatarUri] = useState<string | null>(currentAvatarUrl || null);

  const pickImage = async () => {
    // 1. Request dynamic permissions to access the photo library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied", 
        "We need access to your photo gallery to update your display picture."
      );
      return;
    }

    // 2. Launch the native system image picker UI
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // Expo 54 syntax array configuration
      allowsEditing: true,    // Force a cropping box overlay
      aspect: [1, 1],         // Enforce a perfect square aspect ratio for avatars
      quality: 0.5,           // Compress it down to 50% quality so your app memory stays fast
    });

    // 3. Handle the selection result cleanly
    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      setAvatarUri(selectedUri);
      
      if (onAvatarChange) {
        onAvatarChange(selectedUri); // Passes the string path back up to your profile context/state
      }
    }
  };

  return (
    <View className="items-center justify-center my-6">
      <Pressable 
        onPress={pickImage}
        className="relative active:opacity-90 transition-all"
      >
        {/* Avatar Image Wrapper */}
        <View className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md justify-center items-center">
          {avatarUri ? (
            <Image 
              source={{ uri: avatarUri }} 
              className="w-full h-full object-cover" 
            />
          ) : (
            // Fallback placeholder when no image is selected yet
            <User size={64} color="#94a3b8" />
          )}
        </View>

        {/* Small floating action overlay button indicator */}
        <View className="absolute bottom-0 right-1 bg-[#006d43] w-10 h-10 rounded-full border-4 border-white items-center justify-center shadow-sm">
          <Camera size={16} color="#ffffff" />
        </View>
      </Pressable>
      
      <Text className="text-xs font-semibold text-slate-400 mt-3 uppercase tracking-wider">
        Tap to change photo
      </Text>
    </View>
  );
}
