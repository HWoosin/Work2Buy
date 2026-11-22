import React, { useEffect, useMemo, useState } from "react";
import { CURRENCIES, CurrencyCode } from "../../constants/currencies";
import { Language, WorkProfile, translations, palette } from "./constants";
import { calculateWorkCost, formatWorkDays } from "./calculatorUtils";
import InputField from "./components/InputField";
import WorkProfileModals from "./components/WorkProfileModals";
import SettingsModal from "./components/SettingsModal";
import WishlistScreen from "../wishlist/WishlistScreen";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  LogBox,
} from "react-native";

LogBox.ignoreLogs([
  "근무조건 저장 실패:",
  "근무조건 목록 조회 실패:",
  "앱 설정 불러오기 실패:",
  "근무조건 삭제 실패:",
]);

import {
  getWorkProfiles,
  saveWorkProfile,
  deleteWorkProfile,
  getAppPreferences,
  saveAppPreferences,
} from "../../database/database";

export default function HomeScreen() {
  // 근무 조건은 항상 0부터 시작
  const [salary, setSalary] = useState("0");
  const [workHours, setWorkHours] = useState("0");
  const [workDays, setWorkDays] = useState("0");
  const [price, setPrice] = useState("0");
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  const [isDark, setIsDark] = useState(false);
  const [language, setLanguage] = useState<Language>("ko");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [saveStatus, setSaveStatus] = useState("");

  const t = translations[language];
  const colors = isDark ? palette.dark : palette.light;
  // 근무조건 저장 및 불러오기
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [workProfiles, setWorkProfiles] = useState<WorkProfile[]>([]);
  //   const [shouldAutoSave, setShouldAutoSave] = useState(false);

  // 앱 설정 불러오기
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const preferences = await getAppPreferences();

        if (preferences) {
          setCurrency(preferences.currency === "USD" ? "USD" : "KRW");
          setIsDark(preferences.theme === "dark");
          setLanguage(preferences.language === "en" ? "en" : "ko");
        }
      } catch (error) {
        console.error("앱 설정 불러오기 실패:", error);
      }
    };

    loadPreferences();
  }, []);

  // 앱 설정 변경 및 저장
  const updatePreferences = async (
    nextDark: boolean,
    nextLanguage: Language,
    nextCurrency: CurrencyCode = currency,
  ) => {
    setIsDark(nextDark);
    setLanguage(nextLanguage);
    setCurrency(nextCurrency);

    await saveAppPreferences(
      nextDark ? "dark" : "light",
      nextLanguage,
      nextCurrency,
    );
  };

  // 통화 상태 변경
  const [currency, setCurrency] = useState<CurrencyCode>("KRW");

  // 근무조건 저장 모달 열기
  const openSaveModal = () => {
    setProfileName("");
    setSaveStatus("");
    setIsSaveModalOpen(true);
  };

  // 근무조건 저장
  const handleSaveProfile = async () => {
    const name = profileName.trim();

    const monthlySalary = Number(salary);
    const dailyHours = Number(workHours);
    const monthlyDays = Number(workDays);

    if (!name || monthlySalary <= 0 || dailyHours <= 0 || monthlyDays <= 0) {
      setSaveStatus(t.invalidProfile);
      return;
    }

    try {
      await saveWorkProfile(name, monthlySalary, dailyHours, monthlyDays);

      setIsSaveModalOpen(false);
      setProfileName("");
      setSaveStatus(t.profileSaved);
    } catch (error) {
      console.error("근무조건 저장 실패:", error);
      setSaveStatus(t.duplicateProfile);
    }
  };

  // 저장된 근무조건 목록 열기
  const openLoadModal = async () => {
    setSaveStatus("");
    try {
      const profiles = await getWorkProfiles();
      setWorkProfiles(profiles as WorkProfile[]);
      setIsLoadModalOpen(true);
    } catch (error) {
      console.error("근무조건 목록 조회 실패:", error);
      setSaveStatus(t.saveError);
    }
  };

  // 선택한 근무조건 적용
  const handleLoadProfile = (profile: WorkProfile) => {
    setSalary(String(profile.monthly_salary));
    setWorkHours(String(profile.daily_work_hours));
    setWorkDays(String(profile.monthly_work_days));

    setIsLoadModalOpen(false);
    setSaveStatus(`${profile.name} - ${t.previousLoaded}`);
  };

  // 저장된 근무조건 삭제
  const handleDeleteProfile = (profile: WorkProfile) => {
    Alert.alert(t.delete, `${profile.name} - ${t.delete}?`, [
      {
        text: t.cancel,
        style: "cancel",
      },
      {
        text: t.delete,
        style: "destructive",
        onPress: async () => {
          try {
            await deleteWorkProfile(profile.id);

            const profiles = await getWorkProfiles();
            setWorkProfiles(profiles as WorkProfile[]);
          } catch (error) {
            console.error("근무조건 삭제 실패:", error);
            setSaveStatus(t.saveError);
          }
        },
      },
    ]);
  };

  // 구매 노동시간 계산
  const result = useMemo(
    () => calculateWorkCost(salary, workHours, workDays, price),
    [salary, workHours, workDays, price],
  );

  if (isWishlistOpen) {
    return (
      <WishlistScreen
        onBack={() => setIsWishlistOpen(false)}
        onEditWorkConditions={() => {
          setIsWishlistOpen(false);
          // 근무조건 설정 화면을 여는 코드가 여기에 필요합니다.
        }}
        colors={colors}
        language={language}
        currency={currency}
        monthlySalary={Number(salary)}
        dailyHours={Number(workHours)}
        monthlyDays={Number(workDays)}
      />
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          {/* 상단 */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.logo, { color: colors.logo }]}>
                WORK2BUY
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                {t.subtitle}
              </Text>
            </View>

            <Pressable
              style={[
                styles.wishlistButton,
                { backgroundColor: colors.button },
              ]}
              onPress={() => setIsWishlistOpen(true)}
            >
              <Text
                style={{
                  color: colors.buttonText,
                  fontSize: 12,
                  fontWeight: "800",
                }}
              >
                {language === "ko" ? "구매 보관함" : "Wishlist"}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.settingsButton, { backgroundColor: colors.card }]}
              onPress={() => setIsSettingsOpen(true)}
            >
              <Text style={{ fontSize: 22, color: colors.text }}>⚙</Text>
            </Pressable>
          </View>

          {/* 근무 조건 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t.workCondition}
            </Text>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <InputField
                label={t.salary}
                value={salary}
                onChange={setSalary}
                suffix={CURRENCIES[currency].symbol}
                colors={colors}
              />

              <View style={styles.row}>
                <View style={styles.half}>
                  <InputField
                    label={t.workHours}
                    value={workHours}
                    onChange={setWorkHours}
                    suffix={language === "ko" ? "시간" : "hrs"}
                    colors={colors}
                  />
                </View>

                <View style={styles.half}>
                  <InputField
                    label={t.workDays}
                    value={workDays}
                    onChange={setWorkDays}
                    suffix={language === "ko" ? "일" : "days"}
                    colors={colors}
                  />
                </View>
              </View>

              {/* 근무조건 저장 및 불러오기 */}
              <View style={styles.profileButtonRow}>
                <Pressable
                  style={[
                    styles.profileButton,
                    { backgroundColor: colors.button },
                  ]}
                  onPress={openSaveModal}
                >
                  <Text
                    style={[
                      styles.previousButtonText,
                      { color: colors.buttonText },
                    ]}
                  >
                    + {t.saveProfile}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.profileButton,
                    { backgroundColor: colors.button },
                  ]}
                  onPress={openLoadModal}
                >
                  <Text
                    style={[
                      styles.previousButtonText,
                      { color: colors.buttonText },
                    ]}
                  >
                    ↻ {t.loadProfile}
                  </Text>
                </Pressable>
              </View>

              {!!saveStatus && (
                <Text style={[styles.saveStatus, { color: colors.muted }]}>
                  {saveStatus}
                </Text>
              )}
            </View>
          </View>

          {/* 구매할 물건 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t.purchase}
            </Text>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <InputField
                label={t.price}
                value={price}
                onChange={setPrice}
                suffix={CURRENCIES[currency].symbol}
                colors={colors}
              />
            </View>
          </View>

          {/* 계산 결과 */}
          <View style={[styles.resultCard, { backgroundColor: colors.result }]}>
            <Text style={styles.resultCaption}>{t.result}</Text>

            {result ? (
              <>
                <Text style={styles.resultNumber}>
                  {result.requiredHours.toFixed(1)}
                  <Text style={styles.resultUnit}>
                    {language === "ko" ? " 시간" : " hrs"}
                  </Text>
                </Text>

                <View
                  style={[
                    styles.resultDivider,
                    { backgroundColor: colors.divider },
                  ]}
                />

                <View style={styles.resultRow}>
                  <View>
                    <Text style={styles.resultLabel}>{t.hourly}</Text>
                    <Text style={styles.resultValue}>
                      {CURRENCIES[currency].symbol}
                      {Math.round(result.hourlyWage).toLocaleString("ko-KR")}
                    </Text>
                  </View>

                  <View>
                    <Text style={styles.resultLabel}>{t.days}</Text>
                    <Text style={styles.resultValue}>
                      {/* {result.requiredDays.toFixed(1)}  기존 일수만 나오던것을 년 월 일 단위로 세팅*/}
                      {formatWorkDays(result.requiredDays, language)}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.emptyText}>{t.invalid}</Text>
            )}
          </View>

          <Text style={[styles.footer, { color: colors.muted }]}>
            {t.footer}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <WorkProfileModals
        isSaveModalOpen={isSaveModalOpen}
        isLoadModalOpen={isLoadModalOpen}
        profileName={profileName}
        saveStatus={saveStatus}
        workProfiles={workProfiles}
        colors={colors}
        language={language}
        currency={currency}
        t={t}
        onChangeProfileName={setProfileName}
        onCloseSave={() => setIsSaveModalOpen(false)}
        onCloseLoad={() => setIsLoadModalOpen(false)}
        onSave={handleSaveProfile}
        onLoad={handleLoadProfile}
        onDelete={handleDeleteProfile}
      />

      <SettingsModal
        visible={isSettingsOpen}
        isDark={isDark}
        language={language}
        currency={currency}
        colors={colors}
        t={t}
        onClose={() => setIsSettingsOpen(false)}
        onUpdate={updatePreferences}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  container: {
    padding: 22,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 32,
  },
  logo: {
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 7,
  },
  wishlistButton: {
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  settingsButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  half: {
    flex: 1,
  },
  previousButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  profileButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  profileButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveStatus: {
    fontSize: 11,
    textAlign: "right",
    marginTop: 10,
  },
  resultCard: {
    borderRadius: 22,
    padding: 22,
    marginTop: 4,
  },
  resultCaption: {
    fontSize: 14,
    color: "#CBD5E1",
    fontWeight: "600",
  },
  resultNumber: {
    fontSize: 46,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 13,
  },
  resultUnit: {
    fontSize: 20,
    fontWeight: "600",
  },
  resultDivider: {
    height: 1,
    marginVertical: 22,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resultLabel: {
    color: "#CBD5E1",
    fontSize: 12,
    marginBottom: 8,
  },
  resultValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  emptyText: {
    color: "#CBD5E1",
    marginTop: 15,
    fontSize: 14,
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    marginTop: 28,
  },
});
