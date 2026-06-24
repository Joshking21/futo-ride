import React from "react";
import { Button, ButtonText } from "./ui/button";

interface StyledButtonProps {
  title: string;
  onPress?: () => void;
  className?: string;
  variant?: string; // for backward compatibility/stubs
}

export default function StyledButton({ title, onPress, className }: StyledButtonProps) {
  return (
    <Button onPress={onPress} className={className}>
      <ButtonText>{title}</ButtonText>
    </Button>
  );
}