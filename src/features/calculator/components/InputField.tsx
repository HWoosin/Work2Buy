import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { PaletteColors } from "../constants";

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix: string;
  colors: PaletteColors;
};

export default function InputField({
  label,
  value,
  onChange,
  suffix,
  colors,
}: InputFieldProps) {
  const formatNumber = (value: string) => {
    const number = value.replace(/[^0-9]/g, "");
    return number ? Number(number).toLocaleString("ko-KR") : "";
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.muted }]}>{label}</Text>

      <View style={[styles.inputBox, { backgroundColor: colors.input }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={formatNumber(value)}
          onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.muted}
          selectTextOnFocus
        />
        <Text style={[styles.suffix, { color: colors.muted }]}>{suffix}</Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  inputGroup: { flex: 1, marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: "600", marginBottom: 9 },
  inputBox: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 13, height: 52 },
  input: { flex: 1, fontSize: 17, fontWeight: "700", paddingVertical: 0 },
  suffix: { fontSize: 14, marginLeft: 8 },
});
