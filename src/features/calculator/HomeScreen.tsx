import React, { useEffect, useMemo, useState } from "react";
import { CURRENCIES, CurrencyCode } from "../../constants/currencies";

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  Modal,
  Alert,
} from "react-native";

import {
  getWorkProfiles,
  saveWorkProfile,
  deleteWorkProfile,
  getAppPreferences,
  saveAppPreferences,
} from "../../database/database";

type Language = "ko" | "en";

type WorkProfile = {
  id: number;
  name: string;
  monthly_salary: number;
  daily_work_hours: number;
  monthly_work_days: number;
};

const translations = {
  ko: {
    subtitle: "당신의 노동시간으로 소비를 계산하세요.",
    workCondition: "나의 근무 조건",
    salary: "월 실수령액",
    workHours: "하루 근무시간",
    workDays: "월 근무일",
    previous: "이전 근무조건 불러오기",
    previousLoaded: "이전 근무조건을 불러왔습니다.",
    noPrevious: "저장된 근무조건이 없습니다.",
    loading: "불러오는 중...",
    saving: "저장 중...",
    saved: "저장 완료",
    saveError: "저장 실패",
    purchase: "구매할 물건",
    price: "구매 가격",
    result: "이 물건을 사기 위해 필요한 시간",
    hourly: "시간당 실수령액",
    days: "근무일 환산",
    invalid: "올바른 금액과 근무 조건을 입력해 주세요.",
    settings: "설정",
    theme: "화면 테마",
    light: "라이트 모드",
    dark: "다크 모드",
    language: "언어 설정",
    close: "닫기",
    footer: "WORK2BUY · 당신의 시간에는 가치가 있습니다.",
    saveProfile: "근무조건 저장",
    loadProfile: "저장된 근무조건 불러오기",
    profileName: "근무조건 이름",
    profileNamePlaceholder: "예: 본업, 아르바이트",
    save: "저장",
    cancel: "취소",
    noProfiles: "저장된 근무조건이 없습니다.",
    delete: "삭제",
    profileSaved: "근무조건을 저장했습니다.",
    invalidProfile: "근무조건을 모두 올바르게 입력해 주세요.",
    duplicateProfile: "이미 사용 중인 이름입니다.",
  },

  en: {
    subtitle: "See what things cost in work time.",
    workCondition: "Work Details",
    salary: "Monthly Net Income",
    workHours: "Hours per Workday",
    workDays: "Workdays per Month",
    previous: "Load Previous Settings",
    previousLoaded: "Previous settings loaded.",
    noPrevious: "No saved settings found.",
    loading: "Loading...",
    saving: "Saving...",
    saved: "Saved",
    saveError: "Save failed",
    purchase: "What Are You Buying?",
    price: "Purchase Price",
    result: "Time Needed to Afford This",
    hourly: "Hourly Net Pay",
    days: "Equivalent Work Time",
    invalid: "Please enter valid amounts and work details.",
    settings: "Settings",
    theme: "Theme",
    light: "Light Mode",
    dark: "Dark Mode",
    language: "Language",
    close: "Close",
    footer: "WORK2BUY · Your time has value.",
    saveProfile: "Save Work Details",
    loadProfile: "Load Saved Work Details",
    profileName: "Profile Name",
    profileNamePlaceholder: "e.g. Full-time Job",
    save: "Save",
    cancel: "Cancel",
    noProfiles: "No saved work details.",
    delete: "Delete",
    profileSaved: "Work details saved.",
    invalidProfile: "Please enter valid work details.",
    duplicateProfile: "This name is already in use.",
  },
};

const palette = {
  light: {
    background: "#F5F6FA",
    card: "#FFFFFF",
    input: "#F8FAFC",
    text: "#1E293B",
    muted: "#64748B",
    logo: "#172554",
    result: "#172554",
    divider: "#334678",
    button: "#E8EEFF",
    buttonText: "#2446A8",
    border: "#E2E8F0",
  },
  dark: {
    background: "#0F172A",
    card: "#1E293B",
    input: "#334155",
    text: "#F8FAFC",
    muted: "#94A3B8",
    logo: "#BFDBFE",
    result: "#1E3A5F",
    divider: "#475569",
    button: "#334155",
    buttonText: "#BFDBFE",
    border: "#475569",
  },
};

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix: string;
  colors: typeof palette.light;
};

function InputField({
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

export default function HomeScreen() {
  // 근무 조건은 항상 0부터 시작
  const [salary, setSalary] = useState("0");
  const [workHours, setWorkHours] = useState("0");
  const [workDays, setWorkDays] = useState("0");
  const [price, setPrice] = useState("0");

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

  // 근무 조건 자동 저장
  //   useEffect(() => {
  //     if (!shouldAutoSave || !isLoaded) return;

  //     const monthlySalary = Number(salary);
  //     const dailyHours = Number(workHours);
  //     const monthlyDays = Number(workDays);

  //     if (monthlySalary <= 0 || dailyHours <= 0 || monthlyDays <= 0) {
  //       return;
  //     }

  //     setSaveStatus(t.saving);

  //     const timer = setTimeout(async () => {
  //       try {
  //         await saveUserSettings(monthlySalary, dailyHours, monthlyDays);

  //         setSaveStatus(t.saved);
  //       } catch (error) {
  //         console.error("근무 조건 저장 실패:", error);
  //         setSaveStatus(t.saveError);
  //       }
  //     }, 500);

  //     return () => clearTimeout(timer);
  //   }, [salary, workHours, workDays, shouldAutoSave, isLoaded, language]);

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

  // 이전 근무 조건 불러오기
  //   const loadPreviousSettings = async () => {
  //     try {
  //       const settings = await getUserSettings();

  //       if (
  //         !settings ||
  //         Number(settings.monthly_salary) <= 0 ||
  //         Number(settings.daily_work_hours) <= 0 ||
  //         Number(settings.monthly_work_days) <= 0
  //       ) {
  //         setSaveStatus(t.noPrevious);
  //         return;
  //       }

  //       // 불러온 값이 자동 저장으로 덮어써지지 않도록 처리
  //       setShouldAutoSave(false);
  //       setSalary(String(settings.monthly_salary));
  //       setWorkHours(String(settings.daily_work_hours));
  //       setWorkDays(String(settings.monthly_work_days));
  //       setSaveStatus(t.previousLoaded);
  //     } catch (error) {
  //       console.error("이전 근무 조건 불러오기 실패:", error);
  //       setSaveStatus(t.saveError);
  //     }
  //   };

  // 통화 상태 변경
  const [currency, setCurrency] = useState<CurrencyCode>("KRW");

  // 입력값 변경
  //   const changeSalary = (value: string) => {
  //     setSalary(value);
  //     // setShouldAutoSave(true);
  //   };

  //   const changeWorkHours = (value: string) => {
  //     setWorkHours(value);
  //     // setShouldAutoSave(true);
  //   };

  //   const changeWorkDays = (value: string) => {
  //     setWorkDays(value);
  //     // setShouldAutoSave(true);
  //   };

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
  const result = useMemo(() => {
    const monthlySalary = Number(salary);
    const dailyHours = Number(workHours);
    const monthlyDays = Number(workDays);
    const itemPrice = Number(price);

    if (
      monthlySalary <= 0 ||
      dailyHours <= 0 ||
      monthlyDays <= 0 ||
      itemPrice <= 0
    ) {
      return null;
    }

    const hourlyWage = monthlySalary / (dailyHours * monthlyDays);

    const requiredHours = itemPrice / hourlyWage;
    const requiredDays = requiredHours / dailyHours;

    return {
      hourlyWage,
      requiredHours,
      requiredDays,
    };
  }, [salary, workHours, workDays, price]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* 상단 */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.logo, { color: colors.logo }]}>WORK2BUY</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {t.subtitle}
            </Text>
          </View>

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

        <Text style={[styles.footer, { color: colors.muted }]}>{t.footer}</Text>
      </ScrollView>

      {/* 근무조건 저장 모달 */}
      <Modal
        visible={isSaveModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSaveModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.profileModal, { backgroundColor: colors.card }]}>
            <Text
              style={[
                styles.modalTitle,
                styles.profileModalTitle,
                { color: colors.text },
              ]}
            >
              {t.saveProfile}
            </Text>

            <Text style={[styles.modalLabel, { color: colors.text }]}>
              {t.profileName}
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.input,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={profileName}
              onChangeText={setProfileName}
              placeholder={t.profileNamePlaceholder}
              placeholderTextColor={colors.muted}
              maxLength={30}
              autoFocus
            />

            {!!saveStatus && (
              <Text style={[styles.modalMessage, { color: colors.muted }]}>
                {saveStatus}
              </Text>
            )}

            <View style={styles.profileButtonRow}>
              <Pressable
                style={[
                  styles.profileButton,
                  { backgroundColor: colors.input },
                ]}
                onPress={() => setIsSaveModalOpen(false)}
              >
                <Text style={{ color: colors.text }}>{t.cancel}</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.profileButton,
                  { backgroundColor: colors.button },
                ]}
                onPress={handleSaveProfile}
              >
                <Text style={{ color: colors.buttonText, fontWeight: "700" }}>
                  {t.save}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 저장된 근무조건 불러오기 모달 */}
      <Modal
        visible={isLoadModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLoadModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.profileModal, { backgroundColor: colors.card }]}>
            <Text
              style={[
                styles.modalTitle,
                styles.profileModalTitle,
                { color: colors.text },
              ]}
            >
              {t.loadProfile}
            </Text>

            <ScrollView style={styles.profileList}>
              {workProfiles.length === 0 ? (
                <Text
                  style={[
                    styles.emptyProfileText,
                    { color: colors.muted },
                  ]}
                >
                  {t.noProfiles}
                </Text>
              ) : (
                workProfiles.map((profile) => (
                  <View
                    key={profile.id}
                    style={[
                      styles.profileItem,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <Pressable
                      style={styles.profileInfo}
                      onPress={() => handleLoadProfile(profile)}
                    >
                      <Text
                        style={[
                          styles.profileNameText,
                          { color: colors.text },
                        ]}
                      >
                        {profile.name}
                      </Text>

                      <Text style={{ color: colors.muted, marginTop: 5 }}>
                        {profile.monthly_salary.toLocaleString("ko-KR")}{" "}
                        {CURRENCIES[currency].symbol}
                        {" · "}
                        {profile.daily_work_hours}{" "}
                        {language === "ko" ? "시간" : "hrs"}
                        {" · "}
                        {profile.monthly_work_days}{" "}
                        {language === "ko" ? "일" : "days"}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDeleteProfile(profile)}
                      hitSlop={8}
                    >
                      <Text style={styles.deleteButtonText}>{t.delete}</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>

            <Pressable
              style={[
                styles.profileButton,
                styles.loadCloseButton,
                { backgroundColor: colors.input },
              ]}
              onPress={() => setIsLoadModalOpen(false)}
            >
              <Text style={{ color: colors.text }}>{t.cancel}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 설정 모달 */}
      <Modal
        visible={isSettingsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSettingsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.settingsModal, { backgroundColor: colors.card }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t.settings}
              </Text>

              <Pressable onPress={() => setIsSettingsOpen(false)}>
                <Text style={[styles.closeText, { color: colors.muted }]}>
                  ✕
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t.theme}
            </Text>

            <View style={styles.optionRow}>
              <Pressable
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: !isDark ? colors.button : colors.input,
                    borderColor: !isDark ? colors.buttonText : colors.border,
                  },
                ]}
                onPress={() => updatePreferences(false, language)}
              >
                <Text style={{ color: colors.text }}>☀ {t.light}</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: isDark ? colors.button : colors.input,
                    borderColor: isDark ? colors.buttonText : colors.border,
                  },
                ]}
                onPress={() => updatePreferences(true, language)}
              >
                <Text style={{ color: colors.text }}>☾ {t.dark}</Text>
              </Pressable>
            </View>

            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t.language}
            </Text>

            <View style={styles.optionRow}>
              <Pressable
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      language === "ko" ? colors.button : colors.input,
                    borderColor:
                      language === "ko" ? colors.buttonText : colors.border,
                  },
                ]}
                onPress={() => updatePreferences(isDark, "ko")}
              >
                <Text style={{ color: colors.text }}>한국어</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      language === "en" ? colors.button : colors.input,
                    borderColor:
                      language === "en" ? colors.buttonText : colors.border,
                  },
                ]}
                onPress={() => updatePreferences(isDark, "en")}
              >
                <Text style={{ color: colors.text }}>English</Text>
              </Pressable>
            </View>

            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {language === "ko" ? "통화" : "Currency"}
            </Text>

            <View style={styles.optionRow}>
              {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                <Pressable
                  key={code}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor:
                        currency === code ? colors.button : colors.input,
                      borderColor:
                        currency === code ? colors.buttonText : colors.border,
                    },
                  ]}
                  onPress={() => updatePreferences(isDark, language, code)}
                >
                  <Text style={{ color: colors.text }}>
                    {CURRENCIES[code].symbol} {code}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.button }]}
              onPress={() => setIsSettingsOpen(false)}
            >
              <Text
                style={[styles.closeButtonText, { color: colors.buttonText }]}
              >
                {t.close}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const formatWorkDays = (days: number, language: Language) => {
  const totalDays = Math.floor(days);

  const years = Math.floor(totalDays / 365);
  const remainingAfterYears = totalDays % 365;

  const months = Math.floor(remainingAfterYears / 30);
  const daysLeft = remainingAfterYears % 30;

  if (language === "en") {
    const parts: string[] = [];

    if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
    if (daysLeft > 0 || parts.length === 0) {
      parts.push(`${daysLeft} ${daysLeft === 1 ? "day" : "days"}`);
    }

    return parts.join(", ");
  }

  if (years > 0) {
    return `${years}년 ${months}개월 ${daysLeft}일`;
  }

  if (months > 0) {
    return `${months}개월 ${daysLeft}일`;
  }

  return `${totalDays}일`;
};

const styles = StyleSheet.create({
  safeArea: {
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
  inputGroup: {
    flex: 1,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 9,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 13,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    paddingVertical: 0,
  },
  suffix: {
    fontSize: 14,
    marginLeft: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  half: {
    flex: 1,
  },
  previousButton: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  settingsModal: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 22,
    padding: 22,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: "900",
  },
  profileModalTitle: {
    marginBottom: 18,
  },
  profileModal: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    borderRadius: 22,
    padding: 22,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalInput: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 12,
    marginBottom: 12,
  },
  profileList: {
    maxHeight: 400,
  },
  emptyProfileText: {
    textAlign: "center",
    paddingVertical: 24,
  },
  profileItem: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingVertical: 15,
  },
  profileInfo: {
    flex: 1,
    paddingRight: 10,
  },
  profileNameText: {
    fontSize: 16,
    fontWeight: "700",
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deleteButtonText: {
    color: "#E05252",
    fontWeight: "600",
  },
  loadCloseButton: {
    marginTop: 15,
  },
  closeText: {
    fontSize: 20,
    padding: 4,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 8,
  },
  optionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  optionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: "800",
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 10,
    marginTop: 16,
  },

  settingOptions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },

  selectedOption: {
    borderWidth: 2,
    borderColor: "#4F46E5",
    backgroundColor: "#EEF2FF",
  },
});
