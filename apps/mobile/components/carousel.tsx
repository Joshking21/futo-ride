import { Button, ButtonText } from "@/components/ui/button";
import { Link } from "expo-router";
import { TrendingUp, Users, Wallet } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  ListRenderItem,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

type CarouselItem = {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
};

const data: CarouselItem[] = [
  {
    id: "1",
    icon: (
      <View className="w-48 h-48 rounded-full bg-emerald-50 items-center justify-center border border-[#bccabe]/15">
        <Wallet size={80} color="#006d43" />
      </View>
    ),
    title: "Oga Ledger",
    description:
      "Welcome to your Digital Veranda—a calm, professional space to manage your business ledger without anxiety.",
  },
  {
    id: "2",
    icon: (
      <View className="w-48 h-48 rounded-full bg-emerald-50 items-center justify-center border border-[#bccabe]/15">
        <TrendingUp size={80} color="#006d43" />
      </View>
    ),
    title: "Track Cash Flow",
    description:
      "Record sales, track expenses, and view business growth statistics clearly, even under direct outdoor sunlight.",
  },
  {
    id: "3",
    icon: (
      <View className="w-48 h-48 rounded-full bg-emerald-50 items-center justify-center border border-[#bccabe]/15">
        <Users size={80} color="#006d43" />
      </View>
    ),
    title: "Manage Debtors",
    description:
      "Keep a transparent ledger of debts, view days overdue, and send clean, polite reminders to your customers.",
  },
];

const MyCarousel = () => {
  const flatListRef = useRef<FlatList<CarouselItem>>(null);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        if (index !== activeIndex && index >= 0 && index < data.length) {
          setActiveIndex(index);
        }
      },
    },
  );

  const renderItem: ListRenderItem<CarouselItem> = ({ item }) => (
    <View
      style={{ width: width }}
      className="flex-1 justify-between items-center px-8 pt-12 pb-6 bg-[#f9f9fc]"
    >
      {/* Decorative Blur Backgrounds */}
      <View
        pointerEvents="none"
        className="absolute top-0 right-0 w-80 h-80 bg-emerald-100/30 rounded-full blur-[80px]"
      />
      <View
        pointerEvents="none"
        className="absolute bottom-20 left-0 w-64 h-64 bg-slate-200/40 rounded-full blur-[60px]"
      />

      {/* Illustration */}
      <View className="flex-1 justify-center items-center z-10">
        {item.icon}
      </View>

      {/* Narrative Section */}
      <View className="w-full mb-8 z-10">
        <Text
          className="text-4xl font-bold text-[#1a1c1e] text-left tracking-tight mb-4"
          style={{ fontFamily: "System" }}
        >
          {item.title}
        </Text>
        <Text
          className="text-base text-[#3d4a41] text-left leading-6 mb-10"
          style={{ fontFamily: "System" }}
        >
          {item.description}
        </Text>

        {item.id === "3" ? (
          <Link href="/login" asChild>
            <Button className="w-full bg-[#006d43] active:bg-[#005232] h-14 rounded-2xl shadow-lg shadow-[#005232]/20">
              <ButtonText className="text-white text-lg font-bold">
                Get Started
              </ButtonText>
            </Button>
          </Link>
        ) : (
          <Button
            onPress={() => {
              flatListRef.current?.scrollToIndex({
                index: activeIndex + 1,
                animated: true,
              });
            }}
            className="w-full bg-white border border-[#bccabe]/30 h-14 rounded-2xl"
          >
            <ButtonText className="text-[#006d43] text-lg font-semibold">
              Continue
            </ButtonText>
          </Button>
        )}
      </View>
    </View>
  );

  return (
    <View className="flex-1 w-full justify-between pb-8 bg-[#f9f9fc]">
      <FlatList
        ref={flatListRef}
        data={data}
        horizontal
        pagingEnabled
        snapToAlignment="center"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Pagination Dots container */}
      <View className="flex-row justify-center items-center mt-2 h-4">
        {data.map((_, index) => {
          const isDotActive = index === activeIndex;
          return (
            <View
              key={index.toString()}
              className={`h-2 rounded-full mx-1 ${
                isDotActive ? "w-6 bg-[#006d43]" : "w-2 bg-[#bccabe]"
              }`}
            />
          );
        })}
      </View>
    </View>
  );
};

export default MyCarousel;
