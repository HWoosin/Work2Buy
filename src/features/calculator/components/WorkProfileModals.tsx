import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CURRENCIES, CurrencyCode } from "../../../constants/currencies";
import { Language, PaletteColors, WorkProfile, translations } from "../constants";

type Translation = typeof translations.ko;

type Props = {
  isSaveModalOpen: boolean;
  isLoadModalOpen: boolean;
  profileName: string;
  saveStatus: string;
  workProfiles: WorkProfile[];
  colors: PaletteColors;
  language: Language;
  currency: CurrencyCode;
  t: Translation;
  onChangeProfileName: (value: string) => void;
  onCloseSave: () => void;
  onCloseLoad: () => void;
  onSave: () => void;
  onLoad: (profile: WorkProfile) => void;
  onDelete: (profile: WorkProfile) => void;
};

export default function WorkProfileModals({
  isSaveModalOpen,
  isLoadModalOpen,
  profileName,
  saveStatus,
  workProfiles,
  colors,
  language,
  currency,
  t,
  onChangeProfileName,
  onCloseSave,
  onCloseLoad,
  onSave,
  onLoad,
  onDelete,
}: Props) {
  return (
    <>
      <Modal visible={isSaveModalOpen} transparent animationType="fade" onRequestClose={onCloseSave}>
        <View style={styles.modalOverlay}>
          <View style={[styles.profileModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.saveProfile}</Text>
            <Text style={[styles.modalLabel, { color: colors.text }]}>{t.profileName}</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              value={profileName}
              onChangeText={onChangeProfileName}
              placeholder={t.profileNamePlaceholder}
              placeholderTextColor={colors.muted}
              maxLength={30}
              autoFocus
            />
            {!!saveStatus && <Text style={[styles.modalMessage, { color: colors.muted }]}>{saveStatus}</Text>}
            <View style={styles.buttonRow}>
              <Pressable style={[styles.profileButton, { backgroundColor: colors.input }]} onPress={onCloseSave}>
                <Text style={{ color: colors.text }}>{t.cancel}</Text>
              </Pressable>
              <Pressable style={[styles.profileButton, { backgroundColor: colors.button }]} onPress={onSave}>
                <Text style={{ color: colors.buttonText, fontWeight: "700" }}>{t.save}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isLoadModalOpen} transparent animationType="fade" onRequestClose={onCloseLoad}>
        <View style={styles.modalOverlay}>
          <View style={[styles.profileModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.loadProfile}</Text>
            <ScrollView style={styles.profileList}>
              {workProfiles.length === 0 ? (
                <Text style={[styles.emptyProfileText, { color: colors.muted }]}>{t.noProfiles}</Text>
              ) : (
                workProfiles.map((profile) => (
                  <View key={profile.id} style={[styles.profileItem, { borderBottomColor: colors.border }]}>
                    <Pressable style={styles.profileInfo} onPress={() => onLoad(profile)}>
                      <Text style={[styles.profileNameText, { color: colors.text }]}>{profile.name}</Text>
                      <Text style={{ color: colors.muted, marginTop: 5 }}>
                        {profile.monthly_salary.toLocaleString("ko-KR")} {CURRENCIES[currency].symbol}
                        {" · "}{profile.daily_work_hours} {language === "ko" ? "시간" : "hrs"}
                        {" · "}{profile.monthly_work_days} {language === "ko" ? "일" : "days"}
                      </Text>
                    </Pressable>
                    <Pressable style={styles.deleteButton} onPress={() => onDelete(profile)} hitSlop={8}>
                      <Text style={styles.deleteButtonText}>{t.delete}</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>
            <Pressable style={[styles.profileButton, styles.loadCloseButton, { backgroundColor: colors.input }]} onPress={onCloseLoad}>
              <Text style={{ color: colors.text }}>{t.cancel}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  profileModal: { width: "100%", maxWidth: 420, maxHeight: "80%", borderRadius: 22, padding: 22 },
  modalTitle: { fontSize: 21, fontWeight: "900", marginBottom: 18 },
  modalLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  modalInput: { minHeight: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 16, marginBottom: 12 },
  modalMessage: { fontSize: 12, marginBottom: 12 },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  profileButton: { flex: 1, minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  profileList: { maxHeight: 400 },
  emptyProfileText: { textAlign: "center", paddingVertical: 24 },
  profileItem: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, paddingVertical: 15 },
  profileInfo: { flex: 1, paddingRight: 10 },
  profileNameText: { fontSize: 16, fontWeight: "700" },
  deleteButton: { paddingHorizontal: 12, paddingVertical: 10 },
  deleteButtonText: { color: "#E05252", fontWeight: "600" },
  loadCloseButton: { marginTop: 15 },
});
