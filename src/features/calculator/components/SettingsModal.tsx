import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { CURRENCIES, CurrencyCode } from "../../../constants/currencies";
import { Language, PaletteColors, translations } from "../constants";

type Translation = typeof translations.ko;
type Props = {
  visible: boolean;
  isDark: boolean;
  language: Language;
  currency: CurrencyCode;
  colors: PaletteColors;
  t: Translation;
  onClose: () => void;
  onUpdate: (dark: boolean, language: Language, currency?: CurrencyCode) => void;
};

export default function SettingsModal({ visible, isDark, language, currency, colors, t, onClose, onUpdate }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t.settings}</Text>
            <Pressable onPress={onClose}><Text style={[styles.closeText, { color: colors.muted }]}>✕</Text></Pressable>
          </View>

          <Text style={[styles.settingLabel, { color: colors.text }]}>{t.theme}</Text>
          <View style={styles.optionRow}>
            <Option label={`☀ ${t.light}`} selected={!isDark} colors={colors} onPress={() => onUpdate(false, language)} />
            <Option label={`☾ ${t.dark}`} selected={isDark} colors={colors} onPress={() => onUpdate(true, language)} />
          </View>

          <Text style={[styles.settingLabel, { color: colors.text }]}>{t.language}</Text>
          <View style={styles.optionRow}>
            <Option label="한국어" selected={language === "ko"} colors={colors} onPress={() => onUpdate(isDark, "ko")} />
            <Option label="English" selected={language === "en"} colors={colors} onPress={() => onUpdate(isDark, "en")} />
          </View>

          <Text style={[styles.settingLabel, { color: colors.text }]}>{language === "ko" ? "통화" : "Currency"}</Text>
          <View style={styles.optionRow}>
            {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
              <Option key={code} label={`${CURRENCIES[code].symbol} ${code}`} selected={currency === code} colors={colors} onPress={() => onUpdate(isDark, language, code)} />
            ))}
          </View>

          <Pressable style={[styles.doneButton, { backgroundColor: colors.button }]} onPress={onClose}>
            <Text style={{ color: colors.buttonText, fontSize: 15, fontWeight: "800" }}>{t.close}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Option({ label, selected, colors, onPress }: { label: string; selected: boolean; colors: PaletteColors; onPress: () => void }) {
  return (
    <Pressable style={[styles.optionButton, { backgroundColor: selected ? colors.button : colors.input, borderColor: selected ? colors.buttonText : colors.border }]} onPress={onPress}>
      <Text style={{ color: colors.text }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modal: { width: "100%", maxWidth: 420, borderRadius: 22, padding: 22 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 26 },
  title: { fontSize: 21, fontWeight: "900" },
  closeText: { fontSize: 20, padding: 4 },
  settingLabel: { fontSize: 15, fontWeight: "800", marginBottom: 12, marginTop: 8 },
  optionRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  optionButton: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  doneButton: { height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8 },
});
