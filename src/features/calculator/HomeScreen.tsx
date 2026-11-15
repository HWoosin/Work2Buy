
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';

import {
  getUserSettings,
  saveUserSettings,
} from '../../database/database';

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix: string;
};

function InputField({
  label,
  value,
  onChange,
  suffix,
}: InputFieldProps) {
  const formatNumber = (value: string) => {
    const number = value.replace(/[^0-9]/g, '');
    return number ? Number(number).toLocaleString('ko-KR') : '';
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          value={formatNumber(value)}
          onChangeText={(text) =>
            onChange(text.replace(/[^0-9]/g, ''))
          }
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#9CA3AF"
          selectTextOnFocus
        />

        <Text style={styles.suffix}>{suffix}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [salary, setSalary] = useState('0');
  const [workHours, setWorkHours] = useState('0');
  const [workDays, setWorkDays] = useState('0');
  const [price, setPrice] = useState('0');

  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState('불러오는 중...');

  // 앱 실행 시 SQLite에서 근무 조건 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getUserSettings();

        if (settings) {
          setSalary(String(settings.monthly_salary));
          setWorkHours(String(settings.daily_work_hours));
          setWorkDays(String(settings.monthly_work_days));
        }

        setSaveStatus('저장 완료');
      } catch (error) {
        console.error('설정 불러오기 실패:', error);
        setSaveStatus('불러오기 실패');
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // 근무 조건 변경 시 SQLite에 자동 저장
  useEffect(() => {
    if (!isLoaded) return;

    const monthlySalary = Number(salary);
    const dailyHours = Number(workHours);
    const monthlyDays = Number(workDays);

    // 빈 값이나 잘못된 값은 저장하지 않음
    if (
      monthlySalary <= 0 ||
      dailyHours <= 0 ||
      monthlyDays <= 0
    ) {
      return;
    }

    setSaveStatus('저장 중...');

    const timer = setTimeout(async () => {
      try {
        await saveUserSettings(
          monthlySalary,
          dailyHours,
          monthlyDays
        );

        setSaveStatus('저장 완료');
      } catch (error) {
        console.error('설정 저장 실패:', error);
        setSaveStatus('저장 실패');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [salary, workHours, workDays, isLoaded]);

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

    const hourlyWage =
      monthlySalary / (dailyHours * monthlyDays);

    const requiredHours = itemPrice / hourlyWage;
    const requiredDays = requiredHours / dailyHours;

    return {
      hourlyWage,
      requiredHours,
      requiredDays,
    };
  }, [salary, workHours, workDays, price]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>WORK2BUY</Text>
            <Text style={styles.subtitle}>
              당신의 노동시간으로 소비를 계산하세요.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>나의 근무 조건</Text>
            <Text style={styles.saveStatus}>{saveStatus}</Text>
          </View>

          <View style={styles.card}>
            <InputField
              label="월 실수령액"
              value={salary}
              onChange={setSalary}
              suffix="원"
            />

            <View style={styles.row}>
              <View style={styles.half}>
                <InputField
                  label="하루 근무시간"
                  value={workHours}
                  onChange={setWorkHours}
                  suffix="시간"
                />
              </View>

              <View style={styles.half}>
                <InputField
                  label="월 근무일"
                  value={workDays}
                  onChange={setWorkDays}
                  suffix="일"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>구매할 물건</Text>

          <View style={styles.card}>
            <InputField
              label="구매 가격"
              value={price}
              onChange={setPrice}
              suffix="원"
            />
          </View>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultCaption}>
            이 물건을 사기 위해 필요한 시간
          </Text>

          {result ? (
            <>
              <Text style={styles.resultNumber}>
                {result.requiredHours.toFixed(1)}
                <Text style={styles.resultUnit}> 시간</Text>
              </Text>

              <View style={styles.resultDivider} />

              <View style={styles.resultRow}>
                <View>
                  <Text style={styles.resultLabel}>
                    시간당 실수령액
                  </Text>
                  <Text style={styles.resultValue}>
                    {Math.round(result.hourlyWage).toLocaleString('ko-KR')}원
                  </Text>
                </View>

                <View>
                  <Text style={styles.resultLabel}>
                    근무일 환산
                  </Text>
                  <Text style={styles.resultValue}>
                    {result.requiredDays.toFixed(1)}일
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>
              올바른 금액과 근무 조건을 입력해 주세요.
            </Text>
          )}
        </View>

        <Text style={styles.footer}>
          WORK2BUY · 당신의 시간에는 가치가 있습니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  container: {
    padding: 22,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  logo: {
    fontSize: 27,
    fontWeight: '900',
    color: '#172554',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 7,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  saveStatus: {
    fontSize: 11,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 14,
  },
  inputLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 9,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 13,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    paddingVertical: 0,
  },
  suffix: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  resultCard: {
    backgroundColor: '#172554',
    borderRadius: 22,
    padding: 22,
    marginTop: 4,
  },
  resultCaption: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  resultNumber: {
    fontSize: 46,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 13,
  },
  resultUnit: {
    fontSize: 20,
    fontWeight: '600',
  },
  resultDivider: {
    height: 1,
    backgroundColor: '#334678',
    marginVertical: 22,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    marginBottom: 8,
  },
  resultValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    color: '#CBD5E1',
    marginTop: 15,
    fontSize: 14,
  },
  footer: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 28,
  },
});
